# PashuRaksha — Development Rules

## 1. Source of Truth

The files in `/docs` define the approved PashuRaksha architecture.

Before implementing a feature, AI coding agents MUST read:

```text
docs/ARCHITECTURE.md
docs/DATABASE.md
docs/API.md
docs/AI_PIPELINE.md
docs/DEVELOPMENT_RULES.md
```

If an implementation request conflicts with these documents, stop and ask for clarification rather than silently changing the architecture.

---

# 2. No Architecture Drift

AI coding agents MUST NOT:

* Add new portals without approval
* Rename major modules without approval
* Create individual animal registration as a requirement
* Create mandatory Animal IDs
* Turn PashuRaksha into a livestock census system
* Create a permanent Farmer → Vet relationship
* Treat AI prediction as final diagnosis
* Create a separate Vet Verification portal
* Treat every potential cluster as a confirmed outbreak
* Combine unrelated vaccine types into one shortage metric

---

# 3. Locked Portals

The application has exactly three primary portals:

```text
Farmer Portal
Veterinarian Portal
Government Portal
```

Do not create alternative portal hierarchies without explicit approval.

---

# 4. Farmer Rules

Farmers have platform accounts.

Farmers may maintain approximate livestock information.

Individual animal registration is NOT mandatory.

The system must accept reports when:

* Animal has no identification
* Only an approximate affected count is known
* A group/flock/herd is affected

---

# 5. Health Case Rules

Every disease/health report should create a Health Case.

Health Case IDs must be unique.

Example:

```text
CASE-2026-001928
```

Cases are the core operational disease-surveillance objects.

---

# 6. AI Rules

AI provides preliminary disease analysis.

AI predictions must never automatically become veterinary confirmation.

AI output must display an appropriate disclaimer.

Veterinary assessment must remain separate from AI analysis.

---

# 7. Veterinary Rules

Veterinarians investigate and assess cases.

Veterinary assessment occurs inside:

```text
Case Management
    |
    v
Case Details
    |
    v
Veterinary Assessment
```

Do not create a separate top-level Vet Verification module.

---

# 8. Government Data Rules

Always distinguish:

```text
OFFICIAL REFERENCE DATA
vs
PASHURAKSHA OPERATIONAL DATA
```

Official census/reference data can be used for planning.

PashuRaksha case reports represent observed operational events.

Never claim that PashuRaksha knows the complete live livestock population.

---

# 9. Vaccination Rules

Vaccines must be represented individually/by relevant product.

Never calculate shortage by adding all vaccines together.

Planning requirements must be based on:

```text
Reference population
+
Applicable protocol
+
Target species
+
Relevant vaccine
```

If the required protocol is unknown, do not invent a number.

---

# 10. Campaign Rules

Campaigns must distinguish:

```text
Planning Target
```

from:

```text
Recorded Activity
```

Do not claim population-wide vaccination coverage without a reliable denominator.

---

# 11. Outbreak Rules

Use careful terminology:

```text
Case
Suspected Case
Confirmed Case
Potential Cluster
High-Risk Area
Outbreak
```

A potential cluster is NOT automatically a confirmed outbreak.

---

# 12. Privacy

Only expose data appropriate to the current user's role.

Farmer information must not be unnecessarily exposed to other farmers.

Government dashboards should prefer aggregated information when individual-level information is unnecessary.

---

# 13. Coding Rules

Use TypeScript.

Prefer strongly typed interfaces/types.

Avoid unnecessary `any`.

Keep components modular.

Keep business logic out of presentation components where practical.

Validate API inputs.

Handle loading, empty, success, and error states.

Use reusable UI components.

Do not duplicate components unnecessarily.

---

# 14. Database Rules

Use relational relationships consistently.

Do not store large media files directly in PostgreSQL.

Store media in appropriate storage and keep references in the database.

Do not silently delete important historical health records.

Important case actions should remain auditable.

---

# 15. AI Agent Rules

AI coding agents should work incrementally.

Do not attempt to rebuild the entire application from a single prompt.

For every task:

1. Read relevant documentation.
2. Inspect existing code.
3. Explain intended changes when the task is complex.
4. Implement only the requested scope.
5. Run appropriate checks.
6. Report files changed.
7. Report tests/checks performed.
8. Do not modify unrelated architecture.

---

# 16. Git Rules

Use small, meaningful commits.

Example:

```text
feat: add farmer health case form
feat: add vet case queue
feat: add government disease map
fix: correct case status transition
refactor: extract case status component
```

Do not mix unrelated features into one commit.

Never force-push or delete important branches without explicit approval.

---

# 17. UI Rules

The UI should prioritize:

* Clarity
* Accessibility
* Mobile responsiveness
* Low-bandwidth friendliness where relevant
* Clear status indicators
* Clear distinction between AI and veterinary decisions

Do not sacrifice usability for visual effects.

---

# 18. Demo Rules

The internal demonstration may use simulated/reference data.

Simulated data must not be represented as verified real-world government data.

Prototype integrations may be mocked where necessary.

The demo should prioritize a complete end-to-end workflow over implementing every theoretical feature.

---

# 19. Feature Development Principle

Build in vertical slices.

Preferred core workflow:

```text
Farmer
 ↓
Health Report
 ↓
Health Case
 ↓
AI Preliminary Diagnosis
 ↓
Vet Case Queue
 ↓
Veterinary Assessment
 ↓
Verified Outcome
 ↓
Government Aggregation
 ↓
Disease Map / Alerts / Dashboard
```

This end-to-end workflow has priority over secondary features.

---

# 20. Final Rule

When uncertain, preserve the existing architecture.

Do NOT invent new entities, workflows, portals, IDs, relationships, or assumptions merely to make implementation easier.

Ask for clarification when an architectural decision is required.

---

## 21. Framework & Compiler Safeguards

This section outlines technical constraints enforced by the tooling stack.

### Compiler Config
* **TypeScript strict**: `"strict": true` is enforced in `tsconfig.json`. Unused variables are flagged as warnings by ESLint.
* **Prisma 7 Configuration**: Connection strings reside exclusively in `prisma.config.ts`. Run `npx prisma format` to format the database PSL file, and `npx prisma generate` to rebuild typings.
* **Next.js 16 Proxying**: Custom middlewares must reside in `proxy.ts` exporting `{ auth as proxy }`.
