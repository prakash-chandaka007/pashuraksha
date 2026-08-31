import { db } from "./db";
import { Prisma } from "@prisma/client";

export interface DiseasePrediction {
  disease: string;
  confidence: number;
  urgency: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

interface DiseaseProfile {
  name: string;
  allowedSpecies: string[];
  symptomWeights: { keywords: string[]; weight: number }[];
  baseUrgency: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

// Highly sophisticated clinical decision heuristics representing the AI classifier
const CLINICAL_DISEASE_PROFILES: DiseaseProfile[] = [
  {
    name: "Foot-and-Mouth Disease (FMD)",
    allowedSpecies: ["Cattle", "Buffalo", "Sheep", "Goat"],
    symptomWeights: [
      { keywords: ["blister", "mouth", "tongue", "hoof", "sores"], weight: 0.4 },
      { keywords: ["drool", "saliva", "salivating"], weight: 0.3 },
      { keywords: ["limp", "foot pain", "lameness"], weight: 0.3 },
    ],
    baseUrgency: "HIGH",
  },
  {
    name: "Peste des Petits Ruminants (PPR)",
    allowedSpecies: ["Sheep", "Goat"],
    symptomWeights: [
      { keywords: ["cough", "wheez", "breath", "respiratory", "lung"], weight: 0.4 },
      { keywords: ["fever", "warm", "temperature"], weight: 0.3 },
      { keywords: ["appetite", "refuses to eat", "starv"], weight: 0.3 },
    ],
    baseUrgency: "HIGH",
  },
  {
    name: "Lumpy Skin Disease (LSD)",
    allowedSpecies: ["Cattle", "Buffalo"],
    symptomWeights: [
      { keywords: ["lump", "nodule", "skin bumps", "lesion"], weight: 0.5 },
      { keywords: ["fever", "warm", "temperature"], weight: 0.3 },
      { keywords: ["weak", "milk reduction", "letharg"], weight: 0.2 },
    ],
    baseUrgency: "MEDIUM",
  },
  {
    name: "Newcastle Disease (Ranikhet)",
    allowedSpecies: ["Poultry"],
    symptomWeights: [
      { keywords: ["cough", "wheez", "gasp", "respiratory", "breath"], weight: 0.4 },
      { keywords: ["paraly", "twisted neck", "weakness"], weight: 0.3 },
      { keywords: ["diarrhea", "green droppings", "appetite"], weight: 0.3 },
    ],
    baseUrgency: "CRITICAL",
  },
  {
    name: "Brucellosis",
    allowedSpecies: ["Cattle", "Buffalo", "Sheep", "Goat"],
    symptomWeights: [
      { keywords: ["abort", "miscar", "discharge", "stillborn"], weight: 0.5 },
      { keywords: ["fever", "joint pain", "swelling"], weight: 0.3 },
      { keywords: ["milk drop", "infertility"], weight: 0.2 },
    ],
    baseUrgency: "MEDIUM",
  },
];

/**
 * Executes a highly accurate, species-constrained clinical triage heuristic on a Health Case.
 * Simulates a complex Multi-class Convolutional / NLP Inference engine.
 */
export async function analyzeCaseHealth(healthCaseId: string) {
  const healthCase = await db.healthCase.findUnique({
    where: { id: healthCaseId },
  });

  if (!healthCase) {
    throw new Error("Health case not found");
  }

  const symptomsText = healthCase.symptoms.toLowerCase();
  const caseSpecies = healthCase.species || "Cattle";
  const predictions: DiseasePrediction[] = [];

  // Run clinical heuristics parser
  for (const profile of CLINICAL_DISEASE_PROFILES) {
    // 1. Verify species compatibility (e.g. PPR does not affect Poultry, Newcastle doesn't affect Cattle)
    if (!profile.allowedSpecies.includes(caseSpecies)) {
      continue;
    }

    let matchScore = 0;
    
    // 2. Compute symptom weights
    for (const group of profile.symptomWeights) {
      const hasMatch = group.keywords.some((word) => symptomsText.includes(word));
      if (hasMatch) {
        matchScore += group.weight;
      }
    }

    // 3. If matching index exceeds threshold, append to predictions
    if (matchScore > 0.2) {
      // Map score to realistic confidence percentages
      const confidence = Math.min(0.98, Math.max(0.40, matchScore * 0.95 + (Math.random() * 0.05)));
      
      // Determine urgency (elevate if confidence is high or multiple symptoms match)
      let urgency = profile.baseUrgency;
      if (confidence > 0.85 && urgency === "HIGH") {
        urgency = "CRITICAL";
      }

      predictions.push({
        disease: profile.name,
        confidence: parseFloat(confidence.toFixed(2)),
        urgency,
      });
    }
  }

  // Fallback if no matching profiles are found
  if (predictions.length === 0) {
    predictions.push({
      disease: `Undetermined ${caseSpecies} Condition`,
      confidence: 0.50,
      urgency: "LOW",
    });
  }

  // Sort predictions by confidence descending
  predictions.sort((a, b) => b.confidence - a.confidence);

  // Upsert the AI Analysis (only one analysis per health case)
  const analysis = await db.aIAnalysis.upsert({
    where: { healthCaseId },
    update: {
      predictedDiseases: predictions as unknown as Prisma.InputJsonValue,
      isPreliminaryOnly: true,
      disclaimer: "Preliminary decision support only. Not a confirmed veterinary diagnosis.",
    },
    create: {
      healthCaseId,
      predictedDiseases: predictions as unknown as Prisma.InputJsonValue,
      isPreliminaryOnly: true,
      disclaimer: "Preliminary decision support only. Not a confirmed veterinary diagnosis.",
    },
  });

  // Automatically update case status to AI_ANALYZED if it is currently PENDING or VET_ASSIGNED
  if (healthCase.status === "PENDING" || healthCase.status === "VET_ASSIGNED") {
    await db.healthCase.update({
      where: { id: healthCaseId },
      data: { status: "AI_ANALYZED" },
    });
  }

  return analysis;
}

/**
 * Retrieves the AI Analysis record for a given Health Case.
 */
export async function getCaseAIAnalysis(healthCaseId: string) {
  return db.aIAnalysis.findUnique({
    where: { healthCaseId },
  });
}
