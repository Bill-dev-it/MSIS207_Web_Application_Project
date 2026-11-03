"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const Module=require("node:module");
const trusted=require("../src/middleware/require-trusted-mutation");
function req(method,headers={}) {return {method,get:key=>headers[key.toLowerCase()]};}
function res() {return {statusCode:200,body:null,status(code){this.statusCode=code;return this;},json(data){this.body=data;return this;}};}

async function run(middleware,request){const response=res();let called=false;await middleware(request,response,()=>{called=true;});return {response,called};}

test("CSRF: GET is allowed without custom header",async()=>{const o=await run(trusted,req("GET"));assert.equal(o.called,true);});
test("CSRF: mutations require custom header",async()=>{const o=await run(trusted,req("POST"));assert.equal(o.response.statusCode,403);assert.equal(o.called,false);});
test("CSRF: cross-site request rejected despite custom header",async()=>{const o=await run(trusted,req("PATCH",{"x-aerorul-request":"1","sec-fetch-site":"cross-site"}));assert.equal(o.response.statusCode,403);});
test("CSRF: allow correct Origin and custom header",async()=>{
  const old=process.env.PUBLIC_WEB_URL;process.env.PUBLIC_WEB_URL="http://localhost:5173";
  try { const o=await run(trusted,req("POST",{"x-aerorul-request":"1","origin":"http://localhost:5173"})); assert.equal(o.called,true); }
  finally {if(old===undefined)delete process.env.PUBLIC_WEB_URL;else process.env.PUBLIC_WEB_URL=old;}
});
test("CSRF: reject unrecognized Origin",async()=>{
  const old=process.env.PUBLIC_WEB_URL;process.env.PUBLIC_WEB_URL="http://localhost:5173";
  try {const o=await run(trusted,req("POST",{"x-aerorul-request":"1","origin":"https://attacker.example"}));assert.equal(o.response.statusCode,403);}
  finally {if(old===undefined)delete process.env.PUBLIC_WEB_URL;else process.env.PUBLIC_WEB_URL=old;}
});

const originalLoad=Module._load;
let mockUser=null, supplierId=null, queryArgs=null;
Module._load=function(name,parent,main){
  if(name==="../config/db" && parent?.filename.endsWith("require-supplier.js"))return {query:async(sql,args)=>{queryArgs=args;return {rows:supplierId?[{supplier_id:supplierId}]:[]};}};
  if(name==="./require-auth" && parent?.filename.endsWith("require-supplier.js"))return {resolveAuthenticatedUser:async()=>mockUser};
  return originalLoad.call(this,name,parent,main);
};
let supplier;
try{supplier=require("../src/middleware/require-supplier");}
finally{Module._load=originalLoad;}

test("Supplier: unauthenticated is 401; no DB lookup",async()=>{mockUser=null;supplierId="20";queryArgs=null;const o=await run(supplier,req("GET"));assert.equal(o.response.statusCode,401);assert.equal(queryArgs,null);});
test("Supplier: BUYER is forbidden, even with cookie",async()=>{mockUser={user_id:"1",company_id:"4",role:"BUYER"};supplierId="20";const o=await run(supplier,req("GET"));assert.equal(o.response.statusCode,403);});
test("Supplier: PENDING profile is forbidden",async()=>{mockUser={user_id:"1",company_id:"4",role:"SUPPLIER"};supplierId=null;const o=await run(supplier,req("GET"));assert.equal(o.response.statusCode,403);});
test("Supplier: approved profile is derived from DB company, not request input",async()=>{
  mockUser={user_id:"1",company_id:"4",role:"SUPPLIER"};supplierId="20";
  const r=req("GET");r.body={supplier_id:"999"};r.headers={"supplier-id":"999"};
  const o=await run(supplier,r);assert.equal(o.called,true);assert.equal(r.supplierId,"20");assert.deepEqual(queryArgs,["4"]);
});
test("Supplier: write must provide custom CSRF header",async()=>{mockUser={user_id:"1",company_id:"4",role:"SUPPLIER"};supplierId="20";const o=await run(supplier,req("PATCH"));assert.equal(o.response.statusCode,403);});
