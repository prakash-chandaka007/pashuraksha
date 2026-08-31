# PashuRaksha — API Specification

## 1. API Principles

The API connects:

* Farmer Portal
* Vet Portal
* Government Portal
* Database
* AI service

All endpoints must enforce authentication and role-based authorization where applicable.

Do not expose government functionality to farmers or veterinarians unless explicitly required.

---

# 2. Authentication

```text
POST /api/auth/login
POST /api/auth/otp/request
POST /api/auth/otp/verify
POST /api/auth/logout
GET  /api/auth/session
```

For the prototype, demo authentication may be used.

Production authentication can later use real mobile OTP infrastructure.

---

# 3. Farmer APIs

## Profile

```text
GET /api/farmer/profile
PUT /api/farmer/profile
```

## Livestock

```text
GET /api/farmer/livestock
POST /api/farmer/livestock
PUT /api/farmer/livestock/:id
```

These represent approximate livestock information.

They must NOT create mandatory individual animal registrations.

---

# 4. Health Case APIs

## Create case

```text
POST /api/cases
```

## Get farmer cases

```text
GET /api/farmer/cases
```

## Get case

```text
GET /api/cases/:id
```

## Update case

```text
PATCH /api/cases/:id
```

## Upload attachment

```text
POST /api/cases/:id/attachments
```

---

# 5. AI APIs

```text
POST /api/cases/:id/ai-analysis
GET  /api/cases/:id/ai-analysis
```

AI analysis returns preliminary decision-support information.

Example response concept:

```json
{
  "predictedCondition": "Lumpy Skin Disease",
  "confidence": 0.91,
  "riskLevel": "HIGH",
  "indicators": [
    "skin lesions",
    "fever",
    "reduced mobility"
  ]
}
```

The UI must clearly identify this as preliminary AI analysis.

---

# 6. Vet APIs

## Case queue

```text
GET /api/vet/cases
```

Supports filtering by:

* Status
* Priority
* Species
* Location
* Date

## Accept/assign case

```text
POST /api/vet/cases/:id/accept
POST /api/vet/cases/:id/assign
```

## Veterinary assessment

```text
POST /api/cases/:id/veterinary-assessment
GET  /api/cases/:id/veterinary-assessment
```

## Field visits

```text
POST /api/cases/:id/field-visits
GET  /api/vet/field-visits
PATCH /api/field-visits/:id
```

---

# 7. Government APIs

## Dashboard

```text
GET /api/government/dashboard
```

## Disease Map

```text
GET /api/government/disease-map
```

Filters may include:

```text
district
taluka
village
species
disease
status
risk
dateRange
```

## Alerts

```text
GET /api/government/alerts
PATCH /api/government/alerts/:id
```

---

# 8. Resource APIs

## Vaccine inventory

```text
GET /api/government/vaccines
POST /api/government/vaccines
PATCH /api/government/vaccines/:id
```

## Veterinary teams

```text
GET /api/government/veterinary-teams
POST /api/government/veterinary-teams
PATCH /api/government/veterinary-teams/:id
```

## Medical camps

```text
GET /api/government/medical-camps
POST /api/government/medical-camps
PATCH /api/government/medical-camps/:id
```

---

# 9. Census / Reference Data

```text
GET /api/government/reference-population
```

The endpoint represents official/reference planning data.

It must not be presented as live PashuRaksha animal registration data.

---

# 10. Vaccination Intelligence

```text
GET /api/government/vaccination-intelligence
```

The service may calculate:

```text
Reference population
+
Applicable vaccination protocol
+
Target species
+
Relevant vaccine inventory
=
Planning requirement / gap
```

If no valid protocol exists, the API must not invent a requirement.

---

# 11. Campaign APIs

```text
GET  /api/government/campaigns
POST /api/government/campaigns
GET  /api/government/campaigns/:id
PATCH /api/government/campaigns/:id
POST /api/government/campaigns/:id/activity
```

Campaign statistics must distinguish:

* Planning target
* Recorded activity

---

# 12. Reports

```text
GET /api/government/reports/disease-trends
GET /api/government/reports/surveillance
GET /api/government/reports/vaccination
GET /api/government/reports/mortality
GET /api/government/reports/response-performance
```

---

# 13. Authorization

Roles:

```text
FARMER
VET
GOVERNMENT
```

General access:

```text
FARMER
- Own profile
- Own livestock information
- Own cases
- Case status relevant to own reports

VET
- Assigned/authorized cases
- Veterinary assessments
- Field visits
- Farmer communication relevant to cases

GOVERNMENT
- Aggregated surveillance
- Disease maps
- Alerts
- Resources
- Campaigns
- Reports
```

---

# 14. API Rules

1. Never expose another farmer's private information unnecessarily.
2. Never allow a farmer to modify a veterinary assessment.
3. Never allow AI output to directly mark a case as clinically confirmed.
4. Government dashboards should use aggregation where individual information is unnecessary.
5. APIs must validate all user input.
6. API errors must be structured consistently.
7. All important state changes should be auditable.

---

## 15. Auth.js Integration Mapping

Auth.js v5 route handlers are mapped dynamically using standard Next.js 16 route config.

### Root Route mapping:
* **GET/POST `/api/auth/[...nextauth]`**: Maps automatically to default endpoints managed by `handlers` exported in `auth.ts`.
* **Login/Session Hooks**: The universal NextAuth callback handler handles credentials verify requests, database checks, and maps the standard user role (`role: "farmer" | "veterinarian" | "admin"`) to request session payload.
