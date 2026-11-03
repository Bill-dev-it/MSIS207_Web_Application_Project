"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const Module=require("node:module");
const load=Module._load;
let state={};
Module._load=function(name,parent,main){
  if(name==="../../services/auth/session.service" && parent?.filename.endsWith("session.controller.js"))return {
    authenticate:async()=>state.loginResult,
    revokeSessions:async(id)=>{state.revokedId=id;},
    COOKIE_NAME:"aerorul_session", SESSION_MS:3600000,
    cookieOptions:()=>({httpOnly:true,sameSite:"lax",secure:false,path:"/"})
  };
  return load.call(this,name,parent,main);
};
let ctl;try{ctl=require("../src/controllers/auth/session.controller");}finally{Module._load=load;}
function response(){return {statusCode:200,data:null,headers:{},cookies:[],status(code){this.statusCode=code;return this;},json(d){this.data=d;return this;},set(k,v){this.headers[k]=v;return this;},cookie(...args){this.cookies.push(args);return this;},clearCookie(...args){this.cookies.push(["clear",...args]);return this;}};}

test("Login: invalid payload rejected before SQL",async()=>{const r=response();await ctl.login({body:{email:"bad",password:"hi"}},r);assert.equal(r.statusCode,400);});
test("Login: successful result sets HttpOnly cookie without returning token",async()=>{
 state.loginResult={status:"OK",token:"secret-token",user:{user_id:"7",role:"BUYER"}};
 const r=response();await ctl.login({body:{email:"user@example.test",password:"validpass"}},r);
 assert.equal(r.statusCode,200);assert.equal(r.cookies[0][0],"aerorul_session");
 assert.equal(r.cookies[0][2].httpOnly,true);assert.equal(r.cookies[0][2].maxAge,3600000);
 assert.equal(JSON.stringify(r.data).includes("secret-token"),false);
});
test("Login: incorrect credentials returns generic 401",async()=>{state.loginResult={status:"INVALID_CREDENTIALS"};const r=response();await ctl.login({body:{email:"user@example.test",password:"wrong"}},r);assert.equal(r.statusCode,401);});
test("Login: unverified email blocked with 403",async()=>{state.loginResult={status:"EMAIL_NOT_VERIFIED"};const r=response();await ctl.login({body:{email:"user@example.test",password:"validpass"}},r);assert.equal(r.statusCode,403);});
test("Me: returns already-authenticated limited user",async()=>{const r=response();await ctl.me({authUser:{user_id:"7",role:"BUYER"}},r);assert.equal(r.data.data.user.user_id,"7");});
test("Logout: revokes JWT via auth_version before clearing cookie",async()=>{state.revokedId=null;const r=response();await ctl.logout({authUser:{user_id:"7"}},r);assert.equal(state.revokedId,"7");assert.equal(r.cookies[0][0],"clear");});
