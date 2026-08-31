# PashuRaksha — System Architecture

## 1. Project Overview

PashuRaksha is a Digital Livestock Health & Epidemic Intelligence Ecosystem designed to support early detection, prevention, surveillance, and management of livestock diseases.

The system has three role-based portals:

1. Farmer Portal
2. Veterinarian Portal
3. Government Portal

The system is designed around health cases and disease surveillance rather than individual-animal registration.

---

# 2. Core Architecture

```text
                         PASHURAKSHA
                              |
              +---------------+---------------+
              |               |               |
              v               v               v
           FARMER            VET          GOVERNMENT
           PORTAL           PORTAL        COMMAND CENTER
              |               |               |
              v               v               v
        Health Reports    Case Management   Surveillance
        Livestock Info    Vet Assessment    Disease Map
        Vaccination       Field Visits      Alerts
        Alerts            Tele-vet          Resources
                                            Campaigns
                                            Reports
              |               |               |
              +---------------+---------------+
                              |
                              v
                    CENTRAL HEALTH DATA
```

---

# 3. Farmer Portal

```text
FARMER
   |
   v
LOGIN / OTP
   |
   v
FARMER PROFILE
   |
   +--------------------+
   |                    |
   v                    v
REPORT HEALTH ISSUE   MY LIVESTOCK
   |
   v
LIVESTOCK DETAILS
   |
   v
HEALTH CASE
   |
   +----------+----------+
   |                     |
   v                     v
AI TRIAGE              LOCATION
   |
   v
VET + GOVERNMENT
```

## Farmer identity

Every farmer who creates an account receives a platform-generated Farmer ID.

Example:

```text
FRM-000184
```

A farmer profile may contain:

* Platform User ID
* Name
* Mobile number
* Village
* District
* Taluka
* Other appropriate profile information

## Animal registration rule

PashuRaksha MUST NOT require registration of every individual animal.

There is NO mandatory platform-generated Animal ID.

A farmer may report:

* Individual animal
* Group
* Herd
* Flock
* Approximate affected animals
* Animals without existing identification

Example:

```text
Cattle: 6
Goats: 12
Poultry: 50
```

A report may specify:

```text
Species: Poultry
Group: Broiler flock
Total flock: 500
Affected: approximately 25
```

The system must accept reports even when individual animal identification is unavailable.

---

# 4. Location

The platform may maintain a location/profile reference associated with farmer information or reports.

Example:

```text
LOC-000492
Village: XYZ
Taluka: ABC
District: Pune
```

Location is important for epidemic surveillance.

However, a location identifier MUST NOT be treated as proof that all livestock in that location are registered in PashuRaksha.

---

# 5. Health Case

Every health/disease report creates a Health Case.

Example:

```text
CASE-2026-001928
```

The Health Case is the primary operational unit for disease surveillance.

A Health Case may contain:

* Reporting farmer
* Location
* Species
* Affected count
* Group/herd/flock information
* Symptoms
* Images
* Audio
* AI analysis
* Veterinary assessment
* Field visits
* Treatment/control actions
* Outcome
* Case status

---

# 6. AI Preliminary Diagnosis

PashuRaksha includes AI-based disease analysis.

The AI may analyze:

* Images
* Audio
* Reported symptoms
* Livestock/species information
* Relevant contextual information

The AI can produce:

* Possible disease/condition
* Confidence score
* Risk level
* Observed indicators
* Recommended next action

Example:

```text
AI PRELIMINARY DIAGNOSIS

Possible condition:
Lumpy Skin Disease

Confidence:
91%

Risk:
HIGH
```

AI output is decision support and is NOT the final clinical diagnosis.

---

# 7. Veterinary Verification

The veterinarian reviews the Health Case and AI output.

Veterinary assessment may contain:

* Clinical assessment
* Suspected disease
* Confidence
* Diagnosis status
* Clinical findings
* Recommended actions
* Treatment/control actions

Diagnosis status may be:

```text
SUSPECTED
CONFIRMED
RULED OUT
```

Veterinary assessment is the authoritative clinical assessment for the case.

There is NO separate "Vet Verification" portal/menu.

Veterinary verification exists inside:

```text
Vet Portal
    |
    v
Case Management
    |
    v
Case Details
    |
    v
Veterinary Assessment
```

---

# 8. Case Lifecycle

The standard Health Case lifecycle is:

```text
NEW
 |
 v
ASSIGNED
 |
 v
UNDER INVESTIGATION
 |
 +-------------------+
 |                   |
 v                   v
SUSPECTED          RULED OUT
 |
 v
VERIFIED / CONFIRMED
 |
 v
TREATMENT / CONTROL
 |
 v
RESOLVED
```

The implementation may represent `VERIFIED` and `CONFIRMED` appropriately, but the distinction between veterinary assessment and AI prediction must always remain clear.

Potential outbreak/cluster flow:

```text
NEW
 |
 v
SUSPECTED
 |
 v
OUTBREAK CLUSTER
 |
 v
GOVERNMENT ALERT
 |
 v
RESPONSE
```

A potential cluster MUST NOT automatically be described as a confirmed outbreak.

---

# 9. Veterinarian Portal

The veterinarian is primarily concerned with:

> Which cases need my attention?

Architecture:

```text
VETERINARIAN LOGIN
       |
       v
VET DASHBOARD
       |
 +-----+-----------------------+
 |             |               |
 v             v               v
CASES      MAP / OUTBREAK   SCHEDULE
 |             |               |
 |             +-- High-risk   |
 |             +-- Nearby     |
 |             +-- Quarantine  |
 |                             |
 v                             v
CASE MANAGEMENT           FIELD VISITS
```

## Vet Dashboard

The dashboard should prioritize:

* Critical cases
* High-risk cases
* Moderate cases
* Priority cases
* Recent cases
* Assigned workload

The primary question is:

> What needs my attention right now?

---

# 10. Case Management

Case Management is the core of the Vet Portal.

Vet Case Details should show:

* Case ID
* Location
* Reporter
* Livestock information
* Affected count
* Symptoms
* AI preliminary diagnosis
* AI risk/confidence
* Attachments
* Veterinary assessment
* Case status
* Field visit information
* Communication options

---

# 11. Field Visits

A veterinarian can create a Field Visit for a case.

A Field Visit may include:

* Case
* Farmer
* Location
* Priority
* Scheduled date/time
* Purpose
* Animals/groups examined
* Clinical findings
* Samples collected
* Provisional diagnosis
* Quarantine requirement
* Visit outcome

---

# 12. Vet Communication

The Vet Portal may provide:

* Call
* Message
* Tele-consultation

For the prototype, communication/notifications may be simulated.

---

# 13. Government Portal

The Government Portal is fundamentally different from the Vet Portal.

Veterinarian question:

> Which cases do I need to handle?

Government question:

> What is happening across my jurisdiction, where is risk increasing, and where should resources be deployed?

Government Portal:

```text
GOVERNMENT PORTAL
|
+-- Dashboard
|
+-- Disease Map
|
+-- Alerts
|
+-- Resources
|     |
|     +-- Vaccination & Supply Intelligence
|     +-- Vaccine Inventory
|     +-- Veterinary Teams
|     +-- Medical Camps
|
+-- Campaigns
|
+-- Reports
```

Government does NOT primarily manage individual cases.

---

# 14. Government Dashboard

The Government Dashboard provides high-level situational awareness.

It may display:

* Active Health Cases
* High-Risk Areas
* Suspected Cases
* Confirmed Cases
* Potential Clusters
* Quarantine Zones
* Available Veterinary Teams
* Active Medical Camps
* Important Alerts

Dashboard metrics must not imply information that the underlying data cannot support.

---

# 15. Disease Map

The Government Disease Map supports geographic surveillance.

Hierarchy:

```text
MAHARASHTRA
    |
    v
DISTRICT
    |
    v
TALUKA
    |
    v
VILLAGE
```

Map layers may include:

* Confirmed cases
* Suspected cases
* High-risk areas
* Quarantine zones
* Potential clusters

The map uses observed/reporting data from PashuRaksha and must not imply complete livestock coverage.

---

# 16. Government Alerts

Alerts answer:

> What requires government attention?

Possible alert sources:

* Rapid increase in cases
* Geographic clustering
* Confirmed disease
* Unusual mortality
* Environmental risk
* Low campaign progress
* Vaccine/resource shortage
* Veterinary workforce shortage
* Quarantine issues

Potential cluster does NOT equal confirmed outbreak.

---

# 17. Government Resources

Resources contains:

```text
Resources
|
+-- Vaccination & Supply Intelligence
+-- Vaccine Inventory
+-- Veterinary Teams
+-- Medical Camps
```

## Vaccination & Supply Intelligence

This is a decision-support/planning module.

It may combine:

```text
Official census/reference data
        |
        v
Applicable vaccination protocol
        |
        v
Target species
        |
        v
Eligible/reference population
        |
        v
Estimated requirement
        |
        v
Relevant vaccine inventory
        |
        v
Planning gap/surplus
```

The system MUST NOT invent vaccine requirements when no applicable protocol or authoritative configuration exists.

---

# 18. Official Census / Reference Population

PashuRaksha does NOT maintain a live national livestock registry.

Official livestock census/reference datasets may be used for population planning.

Example:

```text
Pune

Cattle: 450,000
Buffalo: 180,000
Goats: 220,000
```

These numbers represent reference/planning population, not PashuRaksha-registered animals.

---

# 19. Vaccine Inventory

Vaccine Inventory represents actual stock information.

Inventory may track:

* Vaccine/product
* Disease/program association
* District
* Storage location
* Batch
* Expiry
* Available quantity
* Reserved quantity
* Distributed quantity

Different vaccine types MUST remain separate.

The system MUST NOT combine unrelated vaccines into a single shortage calculation.

---

# 20. Campaigns

Campaigns represent government activities.

Examples:

* Vaccination campaigns
* Deworming campaigns
* Disease screening
* Biosecurity awareness
* Mobile veterinary camps

Campaigns should distinguish:

```text
Planning Target
        vs
Recorded Activity
```

Example:

```text
Planning target: 120,000
Vaccinations recorded: 87,420
```

Do NOT claim actual regional vaccination coverage unless a reliable denominator exists.

---

# 21. Reports

Reports provide historical and administrative analysis.

Examples:

* Disease Trends
* Surveillance
* Vaccination
* District Performance
* Mortality Trends
* Response Performance

Reports may combine:

```text
Official reference data
+
PashuRaksha operational data
+
External environmental data
```

The source and meaning of important metrics must remain clear.

---

# 22. Central Health Data

The central health data model connects:

```text
FARMER
   |
   | reports
   v
HEALTH CASE
   |
   +--> AI ANALYSIS
   |
   +--> VETERINARY ASSESSMENT
   |
   +--> FIELD VISIT
   |
   +--> RESPONSE / OUTCOME
```

Government analytics aggregate these health events.

---

# 23. AI Training / Evaluation Loop

Veterinary outcomes can be used to evaluate and improve the AI system.

```text
AI PRELIMINARY DIAGNOSIS
          |
          v
VETERINARY ASSESSMENT
          |
          v
VERIFIED OUTCOME
          |
          v
MODEL EVALUATION
          |
          v
FUTURE MODEL IMPROVEMENT
```

The system should retain the distinction between:

* AI prediction
* Veterinary assessment
* Final/verified outcome

The AI training pipeline must not automatically retrain a production model from unverified data.

---

# 24. Architectural Principle

PashuRaksha is:

> A livestock health surveillance, early-warning, veterinary response, and government epidemic-intelligence platform.

It is NOT:

* A complete livestock registry
* A replacement for veterinarians
* A definitive autonomous diagnostic system
* A national census system
* A system that assumes every animal is registered

---

## 25. Core Technical Implementation Extensions

This section details the physical folder layout, runtime components, and library frameworks configured for the Next.js 16 stack.

### Folder Mapping
```
pashuraksha/
├── prisma.config.ts        # Prisma 7 connection router
├── prisma/
│   └── schema.prisma       # Database design specifications
├── auth.config.ts          # Auth.js edge session config
├── auth.ts                 # Auth.js node auth core & DB credentials checks
├── proxy.ts                # Next.js 16 authentication guarding middleware
├── lib/
│   └── services/
│       └── db.ts           # Singleton Prisma client instance using pg database adapter
└── app/
    └── api/
        └── auth/
            └── [...nextauth]/route.ts # NextAuth dynamic router handler
```
* **Next.js 16 Routing**: Route routing parameters are resolved dynamically inside Server Components, using typing parameters matching `LayoutProps<"/">`.
* **Prisma 7 Driver Adapter**: Database queries execute on PostgreSQL using the `@prisma/adapter-pg` driver, keeping connection limits small during hot reloads.
