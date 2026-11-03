export function buildRegistrationPayload(fields) {
  const accountType = fields.account_type === "SUPPLIER" ? "SUPPLIER" : "BUYER";
  return {
    account_type: accountType,
    full_name: fields.full_name.trim(),
    email: fields.email.trim().toLowerCase(),
    password: fields.password,
    company_name: fields.company_name.trim(),
    company_type: accountType === "SUPPLIER" ? "SUPPLIER" : fields.company_type,
    country_code: fields.country_code.trim().toUpperCase(),
    ...(fields.tax_id.trim() ? { tax_id: fields.tax_id.trim() } : {}),
    ...(accountType === "SUPPLIER" ? { store_name: fields.store_name.trim() } : {}),
  };
}
