"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const Module = require("node:module");

const realLoad = Module._load;
const log = [];
let mode = "valid";
let released = 0;
const dbClient = {
  async query(sql, params) {
    log.push({sql,params});
    if (sql.includes("FROM public.account_tokens AS t")) {
      return {rows: mode === "invalid" ? [] : [{user_id:"9"}]};
    }
    if (sql.includes("FROM public.users") && sql.includes("FOR UPDATE")) {
      return {rows: mode === "unknown" ? [] : [{user_id:"9", email:"user@example.test"}]};
    }
    if (sql.includes("COUNT(*)::integer AS count")) {
      return {rows:[{count:mode === "throttled" ? 3 : 0,too_soon:mode === "throttled"}]};
    }
    return {rows: []};
  },
  release() { released++; }
};
const pool = {async connect(){return dbClient;}};
Module._load = function(name,parent,main) {
  if(name === "../../config/db" && parent?.filename?.endsWith("verification-token.service.js")) return pool;
  return realLoad.call(this,name,parent,main);
};
let service;
try { service=require("../src/services/auth/verification-token.service"); }
finally { Module._load=realLoad; }

test("only 64-character hex tokens are accepted and token hashing is stable",async()=>{
  assert.equal(service.validToken("abc"),false);
  assert.equal(service.validToken("X".repeat(64)),false);
  assert.equal(service.validToken("a".repeat(64)),true);
  assert.equal(service.hashToken("hello").length,64);
  assert.equal(await service.verifyEmailToken("bad"),false);
});

test("email token verifies once and invalidates all other email links in transaction",async()=>{
  mode="valid";log.length=0;
  assert.equal(await service.verifyEmailToken("a".repeat(64)),true);
  assert.deepEqual(log.filter(x=>["BEGIN","COMMIT","ROLLBACK"].includes(x.sql)).map(x=>x.sql),["BEGIN","COMMIT"]);
  assert.ok(log.some(x=>x.sql.includes("SET email_verified_at = NOW()")));
  assert.ok(log.some(x=>x.sql.includes("SET consumed_at = NOW()")));
  const tokenLookup=log.find(x=>x.sql.includes("FROM public.account_tokens AS t"));
  assert.notEqual(tokenLookup.params[0],"a".repeat(64));
  assert.ok(tokenLookup.sql.includes("t.expires_at > NOW()"));
});

test("invalid/used/expired token leaves database unchanged",async()=>{
  mode="invalid";log.length=0;
  assert.equal(await service.verifyEmailToken("a".repeat(64)),false);
  assert.deepEqual(log.filter(x=>["BEGIN","COMMIT","ROLLBACK"].includes(x.sql)).map(x=>x.sql),["BEGIN","ROLLBACK"]);
  assert.equal(log.some(x=>x.sql.includes("SET email_verified_at")),false);
});

test("resend returns null for unknown or ineligible account without revealing identity",async()=>{
  mode="unknown";log.length=0;
  assert.equal(await service.createResendToken("unknown@example.test"),null);
  assert.deepEqual(log.filter(x=>["BEGIN","COMMIT","ROLLBACK"].includes(x.sql)).map(x=>x.sql),["BEGIN","COMMIT"]);
});

test("resend respects per-account throttling",async()=>{
  mode="throttled";log.length=0;
  assert.equal(await service.createResendToken("user@example.test"),null);
  assert.equal(log.some(x=>x.sql.startsWith("INSERT INTO public.account_tokens")),false);
});

test("resend creates only hashed token with time limit",async()=>{
  mode="valid";log.length=0;
  const result=await service.createResendToken("user@example.test");
  assert.equal(result.email,"user@example.test");
  assert.match(result.token,/^[0-9a-f]{64}$/);
  const insert=log.find(x=>x.sql.startsWith("INSERT INTO public.account_tokens"));
  assert.ok(insert);
  assert.notEqual(insert.params[1],result.token);
  assert.ok(insert.sql.includes("INTERVAL '24 hours'"));
  assert.ok(released>=5);
});
