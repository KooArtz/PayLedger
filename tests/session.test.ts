import test from "node:test";
import assert from "node:assert/strict";
import {signSession,verifySession,demoEnabled} from "../lib/session";
const user={userId:"fixture-user",email:"fixture@example.test",fullName:"Fixture User"};
test("signed sessions round-trip and unsigned identity cookies fail",()=>{const token=signSession(user);assert.deepEqual(verifySession(token),user);assert.equal(verifySession(JSON.stringify(user)),null)});
test("modifying a cookie identity invalidates its signature",()=>{const token=signSession(user);const payload=Buffer.from(JSON.stringify({...user,userId:"admin",expires:Date.now()+60000})).toString("base64url");assert.equal(verifySession(payload+"."+token.split(".")[1]),null)});
test("production demo access requires explicit opt-in and a session secret",()=>{const prior={NODE_ENV:process.env.NODE_ENV,LEDGER_DEMO_MODE:process.env.LEDGER_DEMO_MODE,SESSION_SECRET:process.env.SESSION_SECRET};Object.assign(process.env,{NODE_ENV:"production",LEDGER_DEMO_MODE:"false",SESSION_SECRET:""});try{assert.equal(demoEnabled(),false);assert.throws(()=>signSession(user),/SESSION_SECRET/);process.env.LEDGER_DEMO_MODE="true";assert.equal(demoEnabled(),true)}finally{for(const [key,value] of Object.entries(prior)){if(value===undefined)delete process.env[key];else process.env[key]=value}}});
