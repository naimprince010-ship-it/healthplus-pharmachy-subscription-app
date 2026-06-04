# Sprint A Backlog: World-Class Admin Upgrade

Sprint window: Start immediately
Owner: Engineering + Ops

## Objectives

- Start implementation of the 15-track roadmap with tangible deliverables.
- Ship the first P0 module slice safely.

## User Stories

### A1: Return request lifecycle

- As an admin, I can open a return request for an order.
- As an admin, I can review reason, evidence, and item-level quantity.
- As an admin, I can move return through statuses: requested, approved, rejected, received, closed.

Acceptance criteria:

- Return list has filters by status/date/order/user
- Status change requires note for reject/cancel
- Timeline of transitions is stored

### A2: Refund processing

- As an admin, I can mark refund mode (gateway/wallet/cash adjustment).
- As an admin, I can store external refund reference.
- As an admin, I can see refund status and responsible operator.

Acceptance criteria:

- Refund status transitions are validated
- Amount cannot exceed order paid amount
- Exportable refund report exists

### A3: Audit log foundation

- As a compliance owner, I can trace who changed what and when.

Acceptance criteria:

- Critical admin mutations create audit records
- Record includes actorId, action, entity, entityId, before, after, at
- Audit records are append-only

### A4: Ops command center (v1)

- As an operations lead, I can monitor live workload and risk in one screen.

Acceptance criteria:

- Cards: pending orders, processing backlog, pending payment, SLA risk
- Data refresh can be triggered quickly

## Engineering Tasks

1. Add domain models for return/refund and audit logs
2. Add admin APIs for return create/list/update and refund update
3. Add admin UI pages for return queue and details
4. Add command center API endpoint with aggregate counters
5. Add CSV export endpoint for refunds

## Data/Schema Draft

Planned entities:

- ReturnRequest
- ReturnItem
- RefundTransaction
- AdminAuditLog

## Risk Controls

- Feature flags for return/refund status mutation
- Idempotency keys for refund creation/update
- Manual override actions require reason note

## Test Checklist

- Unit tests: status transition rules
- API tests: auth + validation + edge cases
- Integration tests: return -> refund -> order timeline
- Regression: existing order/admin workflows remain intact

## Done/Progress Tracker

- [ ] A1 return lifecycle
- [ ] A2 refund processing
- [ ] A3 audit base layer
- [ ] A4 ops command center v1
- [ ] Docs/runbook draft
