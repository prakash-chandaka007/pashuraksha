# PashuRaksha — AI Pipeline

## 1. Purpose

The PashuRaksha AI system provides preliminary disease analysis and triage support.

The AI is NOT an autonomous final diagnostic authority.

The veterinarian remains responsible for clinical verification.

---

# 2. AI Flow

```text
FARMER REPORT
      |
      v
INPUT DATA
      |
      +--> Images
      +--> Audio
      +--> Symptoms
      +--> Species
      +--> Context
      |
      v
AI ANALYSIS
      |
      v
PRELIMINARY DIAGNOSIS
      |
      +--> Possible condition
      +--> Confidence
      +--> Risk level
      +--> Indicators
      |
      v
VETERINARIAN
      |
      v
VETERINARY ASSESSMENT
      |
      v
VERIFIED OUTCOME
```

---

# 3. AI Inputs

Potential inputs include:

* Livestock species
* Approximate affected count
* Symptoms
* Images
* Audio
* Reported temperature
* Mobility/feeding observations
* Relevant telemetry when available
* Location/context

Not all inputs are mandatory for every case.

---

# 4. AI Output

Example:

```text
Possible condition:
Lumpy Skin Disease

Confidence:
91%

Risk:
HIGH

Observed indicators:
- Skin lesions
- Fever
- Reduced mobility
```

The UI must display an explicit notice such as:

```text
AI output is preliminary decision support
and requires veterinary verification.
```

---

# 5. Veterinary Verification Loop

```text
AI prediction
      |
      v
Veterinarian review
      |
      +--> Confirmed
      +--> Suspected
      +--> Ruled Out
      |
      v
Verified outcome
```

The AI prediction must remain stored even if the veterinarian disagrees.

Example:

```text
AI:
Lumpy Skin Disease — 91%

Vet:
Ruled Out
```

This is valuable evaluation data.

---

# 6. AI Evaluation

The system should eventually calculate:

* Accuracy
* Precision
* Recall
* F1 score
* False positive rate
* False negative rate
* Performance by species
* Performance by disease
* Performance by geography where appropriate
* Performance by input type/quality

---

# 7. Training Data

Veterinary assessments can provide labelled outcomes.

Conceptually:

```text
Case
 |
 +--> AI Prediction
 |
 +--> Veterinary Assessment
 |
 +--> Outcome
        |
        v
     Labelled Data
        |
        v
   Model Evaluation
        |
        v
 Future Improvement
```

The prototype does not need to train a new production model in real time.

Do NOT automatically retrain a production model from every case.

Training should eventually include appropriate data validation, privacy controls, dataset versioning, and evaluation.

---

# 8. Human-in-the-Loop Principle

PashuRaksha uses:

```text
AI
 |
 v
ASSIST
 |
 v
VETERINARIAN
 |
 v
VERIFY
 |
 v
RESPONSE
```

The AI supports the veterinarian rather than replacing the veterinarian.

---

# 9. Prototype AI

For the internal demonstration, the AI may use:

* A suitable external AI/model API
* A pre-trained model
* A controlled prototype inference service
* Carefully designed demo data

The architecture must keep the AI interface abstract enough that the underlying model can be replaced later.

---

# 10. Model Versioning

Every AI result should ideally retain:

```text
modelName
modelVersion
timestamp
prediction
confidence
```

This allows future evaluation of model versions.

---

# 11. AI Safety

The system must avoid presenting AI predictions as guaranteed diagnoses.

Do not use language such as:

```text
DIAGNOSIS CONFIRMED BY AI
```

Prefer:

```text
AI PRELIMINARY DIAGNOSIS
```

or:

```text
AI-ASSISTED ASSESSMENT
```

Clinical confirmation comes from veterinary assessment.
