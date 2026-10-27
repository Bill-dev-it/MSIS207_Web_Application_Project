/**
 * The ONLY place where DB snake_case rows become API camelCase DTOs.
 * Names map 1:1 to real columns (e.g. engine_code → engineCode, stock_quantity → stockQuantity).
 */
const num = (v) => (v === null || v === undefined ? null : Number(v));
const iso = (v) => (v ? new Date(v).toISOString() : null);

const toUserDto = (r) => ({
  userId: num(r.user_id),
  companyId: num(r.company_id),
  companyName: r.company_name,
  fullName: r.full_name,
  email: r.email,
  role: r.role,
});

module.exports = { num, iso, toUserDto };
