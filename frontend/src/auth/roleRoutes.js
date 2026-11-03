export const ROLE_HOME = Object.freeze({
  BUYER: "/buyer",
  SUPPLIER: "/supplier",
  ADMIN: "/admin",
});

export function postLoginDestination(role, requestedPath) {
  const home = ROLE_HOME[role] || "/";
  if (typeof requestedPath !== "string" || !requestedPath.startsWith(home)) return home;
  if (requestedPath !== home && requestedPath[home.length] !== "/") return home;
  if (requestedPath.includes("\\") || requestedPath.startsWith("//")) return home;
  return requestedPath;
}
