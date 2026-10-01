# Open questions (not derivable from the repository)

| # | Question | Why it matters | Working assumption (until answered) |
|---|---|---|---|
| Q1 | What are the **cycle thresholds** that map predicted RUL → `NORMAL / MONITOR / PREPARE / PRIORITIZE`? Only the enum exists in `01_schema.sql`; `docs/RUL_integration` does not list numbers. | The task forbids inventing thresholds. | API **returns the `urgency` stored in `rul_predictions`** and never recomputes it. Demo seed stores each row's rule in `decision_rule_snapshot` with `"thresholds": "UNSPECIFIED"`. Demo urgency labels are therefore seed data, flagged `is_demo`. |
| Q2 | Is the RUL inference service (`rul-service/`) implemented and what is its URL / health route? Folder only has a README. | Admin "RUL Health Check" must hit a real service. | `RUL_SERVICE_URL` env var + `GET {url}/health`. When unset/unreachable the check reports **DOWN** with real error text – no fake OK. |
| Q3 | Telemetry history: `sensor_uploads` stores file metadata only (`row_count`, cycle range) – raw sensor values live in object storage (`object_key`). | Line-charts of sensor history need numeric series. | Charts use real per-upload `predicted_rul` vs `cycle_at_prediction` from `rul_predictions` (a true time series). Raw 14-sensor charts are **not** drawn until storage is available. |
| Q4 | Moderation: which entity is moderated? Schema has no moderation table. | Needed for Approve/Reject persistence. | Moderated entity = `seller_listings` with `status='DRAFT'` (pending). Approve → `ACTIVE`, Reject → `HIDDEN`; decision + note in new `moderation_decisions` + `audit_logs`. |
| Q5 | Auth provider (SSO / password policy). | Login. | Email+password (bcrypt) → JWT in httpOnly cookie. Demo users in the runtime seed. |
| Q6 | Orders have no overall status column; only `seller_orders.status`. | Orders list filter "status". | Order status is **derived**: lowest-progress seller_order status (CONFIRMED<PROCESSING<SHIPPED<DELIVERED). |
| Q7 | Shipping route map requires coordinates; `addresses` has none. | "map/route table". | Render a route **table** (supplier city → buyer city) from `addresses`. |
