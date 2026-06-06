# Admin Next Sprint Plan (Execution Ready)

Status date: 2026-06-04
Sprint length: 10 working days
Objective: Close A1 fully and ship A2 + A3 foundations with production-safe quality gates.

## Sprint Goals

1. A1 complete: Returns module production-ready
2. A2 MVP: Refund processing live from return details
3. A3 foundation: Audit trail for critical admin actions
4. Ops readiness: Daily runbook and QA checklist finalized

## Team Roles

- Backend lead: Prisma schema, API contracts, transitions, validation
- Frontend lead: Admin UI flows and table/detail pages
- QA owner: Test cases, regression checks, release sign-off
- Ops owner: SOP and adoption checks

## Day-by-Day Plan

### Day 1: A1 hardening backlog close

Scope:

- Stabilize order detail data fetch path
- Add return evidence URL support in detail page
- Ensure all status transitions are deterministic

Implementation focus:

- app/api/admin/orders/[id]/route.ts
- app/(admin)/admin/orders/[id]/page.tsx
- app/(admin)/admin/returns/[id]/page.tsx

Exit criteria:

- No fetch-fail on order -> create return entry path
- Return details renders consistently on refresh and direct URL access

### Day 2: A1 QA and regression pass

Scope:

- Execute full returns checklist
- Verify queue filters, search, and timeline
- Verify mobile admin view for key return pages

Test suites:

- Happy path: create -> reject/approve -> close
- Negative path: note-required and quantity guard
- Access control: non-admin blocked on return APIs

Exit criteria:

- 0 blocker bugs
- 0 high severity defects in returns module

### Day 3: A2 data model and API contract

Scope:

- Add refund models and enums
- Add migration and validation schemas
- Add API endpoints for refund create/update/list by return

Proposed files:

- prisma/schema.prisma
- prisma/migrations/<timestamp>_refunds_phase1/migration.sql
- lib/validations/refunds.ts
- app/api/admin/refunds/route.ts
- app/api/admin/refunds/[id]/route.ts

Exit criteria:

- Refund endpoint contract stable and documented
- Migration applies cleanly in local and staging

### Day 4: A2 UI integration in returns details

Scope:

- Add refund panel inside return details page
- Support modes: gateway, wallet, manual
- Enforce amount and reference validation in UI

Implementation focus:

- app/(admin)/admin/returns/[id]/page.tsx
- optional shared UI helper in components/admin/

Exit criteria:

- Admin can create and update refund state from return page
- Validation and UX hints are clear and non-blocking

### Day 5: A2 business rules and reporting

Scope:

- Guard amount <= paid amount
- Add status transitions: initiated -> processed -> failed/cancelled
- Add CSV export endpoint for refunds

Implementation focus:

- app/api/admin/refunds/export/route.ts
- refund transition utility in lib/

Exit criteria:

- Refund data exportable by date/status
- Core rules enforced both server and UI

### Day 6: A3 audit log schema and write hooks

Scope:

- Create AdminAuditLog table
- Add log writer helper
- Hook into return/refund mutations

Implementation focus:

- prisma/schema.prisma
- prisma/migrations/<timestamp>_admin_audit_log/migration.sql
- lib/admin/audit-log.ts
- app/api/admin/returns/**
- app/api/admin/refunds/**

Exit criteria:

- Every critical mutation writes an immutable audit row

### Day 7: A3 audit viewer page

Scope:

- Add admin page to view audit logs
- Filter by actor, entity type, date

Implementation focus:

- app/(admin)/admin/audit-logs/page.tsx
- app/api/admin/audit-logs/route.ts
- components/admin/AdminSidebar.tsx (menu link)

Exit criteria:

- Audit logs readable and filterable by ops/admin leads

### Day 8: Integration and end-to-end run

Scope:

- End-to-end run: order -> return -> refund -> audit entries
- Verify backward compatibility for existing admin routes

Exit criteria:

- Full workflow verified with no critical issues

### Day 9: Performance and reliability pass

Scope:

- Improve heavy admin page API payloads where needed
- Tune dev/staging stability and compile-time pain points

Exit criteria:

- No new regressions from optimization changes

### Day 10: Release prep and handoff

Scope:

- Final QA signoff
- Release notes and SOP docs
- Team handoff and monitoring checklist

Exit criteria:

- Production deploy checklist complete
- Ops team trained on return/refund handling path

## Implementation Order (File-Level)

1. Prisma model + migration
2. Validation schema
3. API endpoints
4. UI integration
5. Audit hooks
6. List/detail/reporting UX
7. QA and release docs

## Definition of Done

1. Returns + refunds are fully operable from admin UI
2. All critical actions are audit-logged
3. Regression checklist passes on orders, returns, subscriptions
4. Deployment and rollback notes documented

## Risk Register

1. Dev environment instability (memory/disk): keep lightweight scripts and monitor startup
2. Auth/session race in admin flows: keep session checks strict and retry-safe
3. Data integrity risk in transitions: enforce server-side transition guards

## Immediate Next Command for Team

1. Start Day 1 branch and fix order detail reliability path
2. Execute A1 regression checklist before beginning A2 schema work
