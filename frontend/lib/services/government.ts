import { db } from "./db";

/**
 * Ensures the requesting user exists and is a government official.
 */
async function verifyGovernmentRole(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
  });

  if (!user || user.role !== "gov") {
    throw new Error("Access denied. User profile is not registered as a government official.");
  }
}

export interface SurveillanceSummary {
  totalCases: number;
  statusGroups: Record<string, number>;
  districtGroups: Record<string, number>;
  speciesEstimates: {
    Cattle: number;
    Buffalo: number;
    Sheep: number;
    Goat: number;
    Poultry: number;
    Other: number;
  };
}

/**
 * Aggregates operational health case statistics for the Government Dashboard.
 */
export async function getSurveillanceMetrics(govUserId: string): Promise<SurveillanceSummary> {
  await verifyGovernmentRole(govUserId);

  const cases = await db.healthCase.findMany({
    include: {
      farmer: true,
    },
  });

  const summary: SurveillanceSummary = {
    totalCases: cases.length,
    statusGroups: {},
    districtGroups: {},
    speciesEstimates: {
      Cattle: 0,
      Buffalo: 0,
      Sheep: 0,
      Goat: 0,
      Poultry: 0,
      Other: 0,
    },
  };

  for (const c of cases) {
    // 1. Group by status
    summary.statusGroups[c.status] = (summary.statusGroups[c.status] || 0) + 1;

    // 2. Group by district (falls back to farmer's district or case location)
    const district = c.location || c.farmer?.district || "Unknown";
    summary.districtGroups[district] = (summary.districtGroups[district] || 0) + 1;

    // 3. Estimate species from symptom text keywords
    const text = c.symptoms.toLowerCase();
    if (text.includes("cow") || text.includes("bull") || text.includes("cattle") || text.includes("calf")) {
      summary.speciesEstimates.Cattle++;
    } else if (text.includes("buffalo")) {
      summary.speciesEstimates.Buffalo++;
    } else if (text.includes("sheep") || text.includes("lamb")) {
      summary.speciesEstimates.Sheep++;
    } else if (text.includes("goat") || text.includes("kid")) {
      summary.speciesEstimates.Goat++;
    } else if (text.includes("poultry") || text.includes("chicken") || text.includes("bird") || text.includes("hen")) {
      summary.speciesEstimates.Poultry++;
    } else {
      summary.speciesEstimates.Other++;
    }
  }

  return summary;
}

export interface DiseaseAlert {
  id: string;
  district: string;
  type: "POTENTIAL_CLUSTER" | "HIGH_RISK_AREA" | "CONFIRMED_CASE" | "SUSPECTED_CASE";
  message: string;
  timestamp: Date;
}

/**
 * Returns active disease surveillance alerts based on case density and veterinary confirmations.
 * strictly respects domain terminology (Suspected Case, Confirmed Case, Potential Cluster, High-Risk Area).
 */
export async function getRecentAlerts(govUserId: string): Promise<DiseaseAlert[]> {
  await verifyGovernmentRole(govUserId);

  const cases = await db.healthCase.findMany({
    where: {
      createdAt: {
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
      },
    },
    include: {
      farmer: true,
      vetAssessments: true,
    },
  });

  const alerts: DiseaseAlert[] = [];
  const districtCounts: Record<string, number> = {};
  const confirmedDistricts: Record<string, number> = {};

  for (const c of cases) {
    const district = c.location || c.farmer?.district || "Unknown";
    
    // Track case frequency per district
    districtCounts[district] = (districtCounts[district] || 0) + 1;

    // Track confirmed cases
    const hasConfirmation = c.vetAssessments.length > 0;
    if (hasConfirmation) {
      confirmedDistricts[district] = (confirmedDistricts[district] || 0) + 1;
      
      // Individual Confirmed Case alert
      alerts.push({
        id: `alert-confirmed-${c.id}`,
        district,
        type: "CONFIRMED_CASE",
        message: `Clinical confirmation of disease case ${c.caseId} in ${district} by vet.`,
        timestamp: c.createdAt,
      });
    } else {
      // Individual Suspected Case alert
      alerts.push({
        id: `alert-suspected-${c.id}`,
        district,
        type: "SUSPECTED_CASE",
        message: `Suspected disease symptoms reported in case ${c.caseId} in ${district}.`,
        timestamp: c.createdAt,
      });
    }
  }

  // Generate density-based aggregate alerts
  for (const [district, count] of Object.entries(districtCounts)) {
    if (count >= 3) {
      alerts.push({
        id: `alert-cluster-${district}`,
        district,
        type: "POTENTIAL_CLUSTER",
        message: `Potential disease cluster detected: ${count} active reports flagged in ${district} within 30 days.`,
        timestamp: new Date(),
      });
    }

    const confirmedCount = confirmedDistricts[district] || 0;
    if (confirmedCount >= 2) {
      alerts.push({
        id: `alert-highrisk-${district}`,
        district,
        type: "HIGH_RISK_AREA",
        message: `High-Risk Area warning: ${confirmedCount} cases clinically confirmed in ${district}.`,
        timestamp: new Date(),
      });
    }
  }

  // Sort alerts: Potential clusters and High Risk areas first, then confirmed, then suspected (by timestamp desc)
  const severityScore = {
    HIGH_RISK_AREA: 4,
    POTENTIAL_CLUSTER: 3,
    CONFIRMED_CASE: 2,
    SUSPECTED_CASE: 1,
  };

  return alerts.sort((a, b) => {
    const scoreDiff = severityScore[b.type] - severityScore[a.type];
    if (scoreDiff !== 0) return scoreDiff;
    return b.timestamp.getTime() - a.timestamp.getTime();
  });
}
