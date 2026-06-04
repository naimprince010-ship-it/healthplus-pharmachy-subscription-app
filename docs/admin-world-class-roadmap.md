# World-Class Admin Dashboard Roadmap

Status date: 2026-06-04

Goal: Upgrade current admin panel to enterprise-grade ecommerce operations for pharmacy + subscription business.

## Prioritization Model

- Priority P0: Immediate business impact, revenue/risk critical
- Priority P1: High impact, operational efficiency
- Priority P2: Strategic improvements

## 15 Capability Tracks

| # | Capability | Priority | Current Status | Phase |
|---|------------|----------|----------------|-------|
| 1 | Returns / Refunds / RMA | P0 | Missing | Phase 1 |
| 2 | Real-time Ops Command Center | P0 | Partial | Phase 1 |
| 3 | Advanced Fulfillment Orchestration | P0 | Partial | Phase 1 |
| 4 | Inventory Ledger + Batch/Expiry Control | P0 | Partial | Phase 1 |
| 5 | Finance Reconciliation (PG + COD) | P0 | Missing | Phase 1 |
| 6 | RBAC + Approval Workflow + Audit Trail | P0 | Partial | Phase 1 |
| 7 | Fraud & Risk Review Queue | P1 | Missing | Phase 2 |
| 8 | CRM 360 + Support Timeline | P1 | Partial | Phase 2 |
| 9 | Promotion Engine 2.0 (stacking/budget caps) | P1 | Partial | Phase 2 |
| 10 | Searchandising Rules | P1 | Missing | Phase 2 |
| 11 | Procurement + Supplier Scorecard | P1 | Partial | Phase 2 |
| 12 | Experimentation (A/B control panel) | P2 | Missing | Phase 3 |
| 13 | Workflow Automation Rules | P2 | Missing | Phase 3 |
| 14 | Executive Analytics (LTV/CAC/Churn/Cohort) | P2 | Partial | Phase 3 |
| 15 | Incident & Reliability Console | P2 | Missing | Phase 3 |

## Phase Plan

### Phase 1 (Weeks 1-4): Revenue + Risk Foundation

1. Returns / Refunds / RMA
2. Ops Command Center
3. Fulfillment Orchestration
4. Inventory Ledger + Batch/Expiry
5. Finance Reconciliation
6. RBAC + Audit + Approval

Phase 1 success gates:

- Refund TAT reduced by at least 40%
- Late shipment SLA breach alerting live
- Settlement mismatch dashboard live
- Admin critical actions are audit-logged

### Phase 2 (Weeks 5-8): Growth + Efficiency

1. Fraud queue
2. CRM 360
3. Promotion engine 2.0
4. Searchandising rules
5. Procurement module

Phase 2 success gates:

- Promo abuse loss down by at least 20%
- Support first-response time down by at least 25%
- Stock-out incidents down by at least 30%

### Phase 3 (Weeks 9-12): Intelligence + Automation

1. Experimentation
2. Workflow automation
3. Executive analytics
4. Incident console

Phase 3 success gates:

- At least 2 experiments/month from admin
- At least 30% repetitive operations automated
- Cohort/LTV dashboard available for leadership weekly review

## Build Sequence (Implementation Order)

1. Data contracts and event schema
2. Audit logging and permission controls
3. Returns/refunds module (end-to-end)
4. Ops command center widgets
5. Finance reconciliation
6. Inventory ledger and expiry queue
7. Remaining tracks by dependency

## Non-Functional Requirements

- Every admin mutation endpoint requires role + permission checks
- Every critical mutation creates immutable audit logs
- Every queue page supports search/filter/export
- Every financial operation is idempotent and reconciliation-safe
- Alerting pathways must have owner + escalation policy

## Delivery Governance

- Weekly release train for admin modules
- Feature flags for risky features (refund workflow, pricing rules)
- Runbook required for each new module
- Backfill migrations must be reversible

## Immediate Next Sprint (Sprint A)

Sprint A scope (start now):

1. Returns/refunds domain model + API contract
2. Audit log base layer for admin mutations
3. Ops command center v1 cards (order funnel, SLA risk, payment pending)
4. Reconciliation report export skeleton

Definition of done for Sprint A:

- Admin can create and process a return request from order context
- Admin can issue at least one refund type (manual mark + reference)
- All return/refund status transitions are audit-logged
- Command center endpoint returns live counters

## Notes

- Keep backward compatibility for existing orders and subscriptions.
- Avoid breaking current admin routes; new modules should be additive first.
- Train ops team with short SOP docs per module before full rollout.
