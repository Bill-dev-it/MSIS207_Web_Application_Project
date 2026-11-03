"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const Module=require("node:module");
const orig=Module._load;
const sent=[];
Module._load=function(name,parent,main){
  if(name==="nodemailer") return {createTransport(options){return {async sendMail(msg){sent.push({options,msg});return {accepted:[msg.to]};}};}};
  return orig.call(this,name,parent,main);
};
let mail;
try{mail=require("../src/services/auth/verification-mail.service");}finally{Module._load=orig;}
const vars=["SMTP_HOST","SMTP_PORT","SMTP_USER","SMTP_PASS","SMTP_FROM","PUBLIC_WEB_URL"];
const before=Object.fromEntries(vars.map(k=>[k,process.env[k]]));
function fillConfig(){Object.assign(process.env,{
  SMTP_HOST:"smtp.example.test", SMTP_PORT:"587", SMTP_USER:"user", SMTP_PASS:"dummy-no-real-secret",
  SMTP_FROM:"AeroRUL <noreply@example.test>",PUBLIC_WEB_URL:"http://localhost:5173"
});}
test("SMTP missing blocks registration before database writes",()=>{
  delete process.env.SMTP_HOST;
  assert.equal(mail.mailIsConfigured(),false);
});
test("link goes to React verify page and SMTP sends only to requested email",async()=>{
  fillConfig();
  const token="a".repeat(64);
  await mail.sendVerificationEmail("buyer@example.test",token);
  assert.equal(sent.length,1);
  assert.equal(sent[0].msg.to,"buyer@example.test");
  assert.ok(sent[0].msg.text.includes("http://localhost:5173/verify-email?token="));
  assert.equal(sent[0].options.secure,false);
});
test("rejects insecure non-local email verification web link",()=>{
  fillConfig();process.env.PUBLIC_WEB_URL="http://example.test";
  assert.throws(()=>mail.buildVerificationLink("a".repeat(64)),/HTTPS/);
});
test("rejects malformed token without email transmission",()=>{
  fillConfig();
  assert.throws(()=>mail.buildVerificationLink("invalid"),/Invalid/);
});
process.on("exit",()=>{for(const k of vars){if(before[k]===undefined)delete process.env[k];else process.env[k]=before[k];}});
