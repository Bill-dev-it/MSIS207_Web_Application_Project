"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const Module=require("node:module");
const orig=Module._load;
let smtpReady=true, smtpFail=false, registrationCount=0;
let verified=true, issue={email:"x@example.test",token:"a".repeat(64)};
const fakeRegister={async registerAccount(){registrationCount++;return {
  account:{user_id:"1",email:"x@example.test",role:"BUYER",email_verification_required:true},
  verificationToken:"a".repeat(64)
};}};
const fakeMail={mailIsConfigured(){return smtpReady;},async sendVerificationEmail(){if(smtpFail)throw Error("fake smtp failure");}};
const fakeToken={async verifyEmailToken(){return verified;},async createResendToken(){return issue;}};
Module._load=function(name,parent,main){
 if(name==="../../services/auth/register.service" && parent?.filename?.endsWith("register.controller.js"))return fakeRegister;
 if(name==="../../services/auth/verification-mail.service" && parent?.filename?.endsWith("register.controller.js"))return fakeMail;
 if(name==="../../services/auth/verification-mail.service" && parent?.filename?.endsWith("verify-email.controller.js"))return fakeMail;
 if(name==="../../services/auth/verification-token.service" && parent?.filename?.endsWith("verify-email.controller.js"))return fakeToken;
 if(name==="../../services/auth/register.validation" && parent?.filename?.endsWith("register.controller.js"))return {validateRegister(){return {ok:true,value:{}};}};
 return orig.call(this,name,parent,main);
};
let register,verifyEmail,resendVerification;
try{
 ({register}=require("../src/controllers/auth/register.controller"));
 ({verifyEmail,resendVerification}=require("../src/controllers/auth/verify-email.controller"));
}finally{Module._load=orig;}
function res(){return {statusCode:0,payload:null,status(n){this.statusCode=n;return this;},json(data){this.payload=data;return this;}};}
test("register refuses to create account if SMTP not configured",async()=>{
 smtpReady=false;registrationCount=0;
 const r=res();await register({body:{}},r);
 assert.equal(r.statusCode,503);assert.equal(registrationCount,0);
 smtpReady=true;
});
test("register response does not leak the raw verification token",async()=>{
 smtpFail=false;const r=res();await register({body:{}},r);
 assert.equal(r.statusCode,201);assert.equal(r.payload.data.email_verification_sent,true);
 assert.equal(JSON.stringify(r.payload).includes("a".repeat(64)),false);
});
test("SMTP failure after COMMIT returns 201 but reports delivery failure",async()=>{
 smtpFail=true;
 const old=console.error;console.error=()=>{};
 try{const r=res();await register({body:{}},r);assert.equal(r.statusCode,201);assert.equal(r.payload.data.email_verification_sent,false);}
 finally{smtpFail=false;console.error=old;}
});
test("verify-email returns 200 for valid and 400 for invalid/expired token",async()=>{
 verified=true;const req={body:{token:"a".repeat(64)}};
 const good=res();await verifyEmail(req,good);assert.equal(good.statusCode,200);
 verified=false;const bad=res();await verifyEmail(req,bad);assert.equal(bad.statusCode,400);
 const malformed=res();await verifyEmail({body:{token:"bad"}},malformed);assert.equal(malformed.statusCode,400);
 verified=true;
});
test("resend response does not leak whether an email belongs to an account",async()=>{
 smtpReady=true;issue=null;
 const empty=res();await resendVerification({body:{email:"nobody@example.test"}},empty);
 issue={email:"x@example.test",token:"a".repeat(64)};
 const existing=res();await resendVerification({body:{email:"x@example.test"}},existing);
 assert.equal(existing.statusCode,200);
 assert.deepEqual(empty.payload,existing.payload);
});
