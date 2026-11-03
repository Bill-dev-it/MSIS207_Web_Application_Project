"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const Module = require("node:module");
const path = require("node:path");

// Load service using in-memory dependency shims: no database, no network, no JWT secret leaked.
const originalLoad = Module._load;
Module._load = function (name, parent, main) {
  if (name === "argon2") return { verify: async () => true };
  if (name === "jsonwebtoken") return { sign: () => "mock.token", verify: () => ({ sub: "7", av: 0 }) };
  if (name.endsWith("config/db")) return { query: async () => ({ rows: [] }) };
  return originalLoad.call(this, name, parent, main);
};
let source;
try { source = require("../src/services/auth/session.service"); }
finally { Module._load = originalLoad; }
const user = {
  user_id: "7", company_id: "3", full_name: "Example", email: "example@test.invalid",
  role: "SUPPLIER", password_hash: "test-hash", is_active: true,
  email_verified_at: "2026-01-01T00:00:00Z", auth_version: 0
};

// Temporarily configure a dummy test secret, restored immediately after each test.
async function withTestSecret(fn) {
  const previous = process.env.AUTH_JWT_SECRET;
  process.env.AUTH_JWT_SECRET = "example-test-secret-at-least-32-characters-not-for-production";
  try { await fn(); }
  finally { if (previous === undefined) delete process.env.AUTH_JWT_SECRET;
    else process.env.AUTH_JWT_SECRET = previous; }
}

test("login: correct password returns limited user and signed token", async () => withTestSecret(async () => {
  const trace = [];
  const svc = source.createSessionService({
    db: { query: async (sql, args) => { trace.push({sql,args}); return { rows: [user] }; } },
    passwordLib: { verify: async (hash, password) => hash === "test-hash" && password === "secret" },
    tokenLib: { sign: (payload, secret, options) => {
      assert.equal(payload.av, 0); assert.equal(options.algorithm, "HS256");
      assert.equal(options.expiresIn, "1h"); assert.equal(options.subject, "7"); return "jwt-mock";
    } }
  });
  const result = await svc.authenticate(user.email, "secret");
  assert.equal(result.status, "OK"); assert.equal(result.token, "jwt-mock");
  assert.equal(result.user.role, "SUPPLIER"); assert.equal(result.user.password_hash, undefined);
  assert.deepEqual(trace[0].args, [user.email]);
}));

test("login: unknown account and incorrect password are generic", async () => withTestSecret(async () => {
  const a = source.createSessionService({db:{query:async()=>({rows:[]})},passwordLib:{verify:async()=>true},tokenLib:{}});
  assert.equal((await a.authenticate(user.email,"bad")).status,"INVALID_CREDENTIALS");
  const b = source.createSessionService({db:{query:async()=>({rows:[user]})},passwordLib:{verify:async()=>false},tokenLib:{}});
  assert.equal((await b.authenticate(user.email,"bad")).status,"INVALID_CREDENTIALS");
}));

test("login: unverified and disabled user cannot obtain JWT", async () => withTestSecret(async () => {
  for (const [edit,status] of [[{email_verified_at:null},"EMAIL_NOT_VERIFIED"],[{is_active:false},"ACCOUNT_DISABLED"]]) {
    const svc = source.createSessionService({db:{query:async()=>({rows:[{...user,...edit}]})},passwordLib:{verify:async()=>true},tokenLib:{sign:()=>{throw Error("must not sign");}}});
    assert.equal((await svc.authenticate(user.email,"secret")).status,status);
  }
}));

test("session: JWT DB account state is rechecked; wrong auth_version fails", async () => withTestSecret(async () => {
  let version=0;
  const svc=source.createSessionService({
    db:{query:async()=>({rows:[{...user,auth_version:version}]})},passwordLib:{},
    tokenLib:{verify:(token,secret,options)=>{assert.deepEqual(options.algorithms,["HS256"]);return {sub:"7",av:0};}}
  });
  assert.equal((await svc.getAuthenticatedUser("mock-jwt")).user_id,"7");
  version=1;
  assert.equal(await svc.getAuthenticatedUser("mock-jwt"),null);
}));

test("session: invalid, malformed and expired JWT are rejected", async () => withTestSecret(async () => {
  const svc=source.createSessionService({db:{query:async()=>{throw Error("DB must not be called");}},passwordLib:{},tokenLib:{verify:()=>{throw new Error("jwt expired");}}});
  assert.equal(await svc.getAuthenticatedUser(null),null);
  assert.equal(await svc.getAuthenticatedUser("A".repeat(5000)),null);
  assert.equal(await svc.getAuthenticatedUser("expired"),null);
}));

test("logout: increments auth_version on users using bound ID", async () => {
  let observed;
  const svc=source.createSessionService({db:{query:async(sql,params)=>{observed={sql,params};return {rows:[]};}},passwordLib:{},tokenLib:{}});
  await svc.revokeSessions("7");
  assert.match(observed.sql,/auth_version = auth_version \+ 1/);
  assert.deepEqual(observed.params,["7"]);
});
