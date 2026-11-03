import { supplierRequest } from "../api";

export async function fetchSupplierOverview() {
  return (await supplierRequest("/overview")).data;
}
