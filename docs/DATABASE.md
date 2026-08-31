# PashuRaksha — Database Specification

## 1. Database Principles

The database must support the locked PashuRaksha architecture.

Core principles:

1. Farmers have platform accounts.
2. Individual animals are NOT mandatory database entities.
3. Health Cases are the primary operational disease-surveillance entity.
4. AI analysis and veterinary assessment are separate records.
5. Veterinary assessment is separate from AI prediction.
6. Government planning data is separate from real-time PashuRaksha event data.
7. Vaccine inventory is vaccine-specific.
8. Campaign planning targets must not be treated as live livestock population.
9. All important health events must retain location and timestamp information where available.

---

# 2. Core Entities

Initial conceptual entities:

```text
User
FarmerProfile
VetProfile
Location
LivestockProfile
HealthCase
CaseAttachment
AIAnalysis
VeterinaryAssessment
FieldVisit
CaseOutcome
Notification

ReferenceLivestockPopulation
Vaccine
VaccineInventory
VeterinaryTeam
MedicalCamp
Campaign
CampaignActivity
Alert
```

The exact implementation can evolve, but new entities must not contradict the architecture.

---

# 3. User

Represents authentication and role.

Possible roles:

```text
FARMER
VET
GOVERNMENT
```

Example:

```text
User
- id
- role
- name
- mobile
- email (optional)
- createdAt
- updatedAt
```

---

# 4. FarmerProfile

Represents the farmer's application profile.

Example:

```text
FarmerProfile
- id
- userId
- farmerCode
- name
- mobile
- village
- taluka
- district
- locationId
- createdAt
- updatedAt
```

Example farmer code:

```text
FRM-000184
```

---

# 5. VetProfile

Example:

```text
VetProfile
- id
- userId
- vetCode
- designation
- jurisdiction
- assignedArea
- availabilityStatus
- createdAt
- updatedAt
```

A veterinarian may handle many Health Cases.

A farmer may submit many Health Cases.

There is NOT a permanent one-to-one Farmer → Vet relationship.

---

# 6. Location

Location should support geographic aggregation.

Example fields:

```text
Location
- id
- locationCode
- village
- taluka
- district
- state
- latitude
- longitude
- createdAt
- updatedAt
```

Do not assume a Location represents every animal in that location.

---

# 7. LivestockProfile

This is NOT an individual-animal registry.

It represents farmer-provided approximate livestock information.

Possible structure:

```text
LivestockProfile
- id
- farmerId
- species
- category
- approximateCount
- updatedAt
```

Examples:

```text
Cattle: 6
Goats: 12
Poultry: 50
```

No mandatory animal ID.

---

# 8. HealthCase

HealthCase is the central operational entity.

Example:

```text
HealthCase
- id
- caseCode
- farmerId
- locationId
- species
- livestockCategory
- reportingMode
- affectedCount
- totalGroupCount (optional)
- symptoms
- status
- priority
- createdAt
- updatedAt
- assignedVetId
```

Example:

```text
CASE-2026-001928
```

Reporting mode may distinguish:

```text
INDIVIDUAL
GROUP
HERD
FLOCK
MULTIPLE
UNKNOWN
```

---

# 9. CaseAttachment

Stores references to uploaded media.

```text
CaseAttachment
- id
- caseId
- type
- storageUrl
- filename
- createdAt
```

Types:

```text
IMAGE
AUDIO
VIDEO
DOCUMENT
```

Large media files should not be stored directly inside relational database fields.

---

# 10. AIAnalysis

Represents AI output for a Health Case.

```text
AIAnalysis
- id
- caseId
- modelName
- modelVersion
- predictedCondition
- confidence
- riskLevel
- indicators
- recommendations
- createdAt
```

AI analysis must remain separate from VeterinaryAssessment.

---

# 11. VeterinaryAssessment

Represents veterinarian clinical assessment.

```text
VeterinaryAssessment
- id
- caseId
- vetId
- clinicalAssessment
- suspectedDisease
- confidence
- diagnosisStatus
- actions
- createdAt
- updatedAt
```

Diagnosis status:

```text
SUSPECTED
CONFIRMED
RULED_OUT
```

---

# 12. FieldVisit

```text
FieldVisit
- id
- caseId
- vetId
- scheduledAt
- completedAt
- purpose
- animalsExamined
- clinicalFindings
- provisionalDiagnosis
- quarantineRequired
- status
- createdAt
- updatedAt
```

---

# 13. CaseOutcome

Represents the outcome of a case.

Possible information:

```text
CaseOutcome
- id
- caseId
- outcome
- resolutionNotes
- resolvedAt
```

Possible outcomes may include:

```text
RECOVERED
TREATED
QUARANTINED
RULED_OUT
REFERRED
OTHER
```

---

# 14. ReferenceLivestockPopulation

This is government reference/census data.

It is NOT generated from Farmer accounts.

```text
ReferenceLivestockPopulation
- id
- state
- district
- taluka
- village (optional)
- species
- referenceYear
- population
- source
- createdAt
```

This data is used for planning and analysis.

---

# 15. Vaccine

Represents a distinct vaccine/product.

```text
Vaccine
- id
- name
- disease
- targetSpecies
- manufacturer (optional)
- doseUnit
```

Different vaccines must remain distinct.

---

# 16. VaccineInventory

```text
VaccineInventory
- id
- vaccineId
- district
- storageLocation
- batchNumber
- expiryDate
- availableQuantity
- reservedQuantity
- distributedQuantity
- updatedAt
```

Shortage calculations must be performed per relevant vaccine/product, not across unrelated vaccines.

---

# 17. VeterinaryTeam

```text
VeterinaryTeam
- id
- name
- district
- availabilityStatus
- capacity
- currentDeployment
```

---

# 18. MedicalCamp

```text
MedicalCamp
- id
- name
- locationId
- status
- startDate
- endDate
- assignedTeamId
- casesHandled
- notes
```

---

# 19. Campaign

```text
Campaign
- id
- name
- campaignType
- disease
- targetSpecies
- district
- planningTarget
- status
- startDate
- endDate
```

PlanningTarget is a planning value and must not automatically be interpreted as the current live livestock population.

---

# 20. CampaignActivity

Represents recorded campaign activity.

```text
CampaignActivity
- id
- campaignId
- activityType
- quantity
- locationId
- recordedAt
- recordedBy
```

Example:

```text
Vaccinations recorded: 87,420
```

---

# 21. Alert

```text
Alert
- id
- type
- severity
- title
- description
- locationId
- source
- status
- createdAt
- resolvedAt
```

Possible sources:

```text
CASE_CLUSTER
DISEASE_TREND
MORTALITY
ENVIRONMENT
VACCINE_SHORTAGE
TEAM_SHORTAGE
CAMPAIGN
QUARANTINE
```

---

# 22. Important Relationships

```text
User
 |
 +--> FarmerProfile
 |
 +--> VetProfile

FarmerProfile
 |
 +--> LivestockProfile
 |
 +--> HealthCase

HealthCase
 |
 +--> CaseAttachment
 +--> AIAnalysis
 +--> VeterinaryAssessment
 +--> FieldVisit
 +--> CaseOutcome

VeterinaryAssessment
 |
 +--> VetProfile

FieldVisit
 |
 +--> VetProfile

ReferenceLivestockPopulation
 |
 +--> Government planning

Vaccine
 |
 +--> VaccineInventory

Campaign
 |
 +--> CampaignActivity
```

---

# 23. Relationship Rules

A farmer can submit many Health Cases.

A veterinarian can handle many Health Cases.

A Health Case can have multiple AI analyses over time if required.

A Health Case can have veterinary assessment records according to workflow requirements.

A Health Case can have multiple Field Visits.

A Health Case may have multiple attachments.

There is no mandatory Farmer → Animal one-to-many registry.

---

# 24. Data Source Separation

The database must conceptually separate:

```text
REFERENCE / PLANNING DATA
-------------------------
ReferenceLivestockPopulation
Vaccination protocols
Planning targets


OPERATIONAL DATA
----------------
HealthCase
AIAnalysis
VeterinaryAssessment
FieldVisit
CaseOutcome
CampaignActivity


RESOURCE DATA
-------------
VaccineInventory
VeterinaryTeam
MedicalCamp
```

Do not silently mix these datasets.

---

# 25. Data Integrity

The database must preserve:

* Case history
* AI prediction
* Veterinary assessment
* Outcome
* Timestamps
* Location
* User responsible for actions

AI output must never overwrite veterinary assessment.

Veterinary assessment must never overwrite the original AI prediction.

Historical records should remain auditable.

---

## 26. Prisma 7 Implementation Mapping

The following schema maps the database structures into active Prisma models as defined in `prisma/schema.prisma`.

### Active Models & Fields:
* **User**: Connects email authentication with role authorization (`role: "farmer" | "veterinarian" | "admin"`).
* **Farmer**: Maps to `FarmerProfile`, containing platform-generated unique string `farmerId`.
* **LivestockProfile**: Holds aggregated species entries (e.g. species string and count).
* **HealthCase**: Primary operational surveillance record with unique `caseId`.
* **AIAnalysis**: Preliminary decision support with disclaimer string and `isPreliminaryOnly` boolean.
* **VeterinaryAssessment**: Confirmed clinical diagnosis and treatment plans.
* **VaccineInventory**: Tracks vaccine doses at product level.
* **ReferenceCensusData**: Isolates regional official statistics from transactional database queries.
