import {env} from "@/lib/env";
import {getChatGPTUser} from "@/app/chatgpt-auth";
import {kvGet,kvCompareAndSet,kvLPush,kvLTrim} from "./store";
import {type LedgerData,type Actor,type Invoice,sampleData,permissions,uid,outstanding,money,today,daysOverdue,displayDate} from "./model";
import {applyOperation,visibleData,type Operation} from "./operations";
import {sendSms,reminderSms,billSms,combinedReminderSms} from "./sms";
const WS_ID="huvathu-main";const WS_KEY="ws:"+WS_ID;const SNAP_KEY="snap:"+WS_ID;
export class HttpError extends Error{status:number;constructor(message:string,status=400){super(message);this.status=status}}
type Row={ownerId:string;payload:string;revision:number;updatedAt:string};
export async function workspace(){
 const user=await getChatGPTUser();if(!user)throw new HttpError("Sign in to access your business workspace.",401);
 const raw=await kvGet(WS_KEY);let row=raw?JSON.parse(raw) as Row:null;
 if(!row){const seed=sampleData();const initial={ownerId:user.userId,payload:JSON.stringify(seed),revision:1,updatedAt:new Date().toISOString()};await kvCompareAndSet(WS_KEY,null,JSON.stringify(initial));const saved=await kvGet(WS_KEY);if(!saved)throw new HttpError("Workspace could not be initialized.",503);row=JSON.parse(saved) as Row;}
 const data=JSON.parse(row.payload) as LedgerData;
 const member=data.members.find(m=>m.email.toLowerCase()===user.email.toLowerCase());const owner=row.ownerId===user.userId;if(!owner&&!member)throw new HttpError("Your account has not been added to this business. Ask the administrator for access.",403);
 const actor:Actor={userId:user.userId,email:user.email,name:owner?(user.fullName&&user.userId!=="local_seedy"?user.fullName:"Unoosh Ahmed"):member!.name,role:owner?"Super admin":member!.role,customerId:owner?"":member!.customerId,permissions:owner?[]:member!.permissions};return{data,actor,revision:row.revision,updatedAt:row.updatedAt,ownerId:row.ownerId};
}
export function response(data:unknown,status=200){return Response.json(data,{status,headers:{"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}})}
export function errorResponse(error:unknown){if(error instanceof HttpError)return response({error:error.message},error.status);if(error instanceof Error&&error.name==="ZodError"){const iss=(error as any).issues||[];const f=iss[0];const detail=f?((Array.isArray(f.path)&&f.path.length?f.path.join("."):"field")+": "+f.message):"";console.error("Validation failed:",JSON.stringify(iss).slice(0,600));return response({error:"Check the form fields"+(detail?" — "+detail:"")+"."},400);}console.error("Ledger request failed:",error instanceof Error?error.message:"Unknown error");return response({error:error instanceof Error&&!/D1|SQLITE|binding|fetch failed/i.test(error.message)?error.message:"The request could not be saved. Your input has been kept; please try again."},400)}
export function sameOrigin(request:Request){const origin=request.headers.get("origin");if(origin&&new URL(origin).origin!==new URL(request.url).origin)throw new HttpError("Cross-origin requests are not allowed.",403)}
export async function commit(op:Operation,expectedRevision:number){
 const {data,actor,revision,ownerId}=await workspace();
 const canonical=(v:any):any=>Array.isArray(v)?v.map(canonical):v&&typeof v==="object"?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])])):v;
 const encoded=new TextEncoder().encode(JSON.stringify(canonical({type:op.type,payload:op.payload,actorId:actor.userId})));
 const fingerprint=Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",encoded))).map(n=>n.toString(16).padStart(2,"0")).join("");
 const previous=data.audit.find(a=>a.id===op.requestId);if(previous){if(previous.fingerprint!==fingerprint)throw new HttpError("That request identifier was already used for a different action.",409);return{data:visibleData(data,actor),actor,revision,result:{...previous.result,duplicate:true}};}
 if(revision!==expectedRevision)throw new HttpError("The workspace changed while you were editing. Refresh and try saving again.",409);
 const changed=applyOperation(data,actor,op);const stamp=new Date().toISOString();
 changed.data.audit[0].fingerprint=fingerprint;changed.data.audit[0].result=changed.result;
 const stored=await kvCompareAndSet(WS_KEY,revision,JSON.stringify({ownerId,payload:JSON.stringify(changed.data),revision:revision+1,updatedAt:stamp}));
 if(!stored)throw new HttpError("Another change was saved. Refresh and try again.",409);
 // Backups never turn a committed business transaction into a failed response.
 try{await kvLPush(SNAP_KEY,JSON.stringify({id:uid("snapshot"),payload:JSON.stringify(data),createdAt:stamp}));await kvLTrim(SNAP_KEY,0,29);}catch{console.error("Snapshot could not be saved; primary workspace saved.")}
 return{data:visibleData(changed.data,actor),actor,revision:revision+1,result:changed.result};
}
// Sends reminders for a set of invoices, grouped by customer. combined=true → ONE SMS per customer listing all their invoices; combined=false → one SMS per invoice.
export async function sendReminders(w:{data:LedgerData;actor:Actor;revision:number},invoices:Invoice[],opts:{combined:boolean;markSweep?:boolean}){
 const d=w.data,cur=d.business.currency,biz=d.business.name,now=today(d.business.timeZone);
 const groups=new Map<string,Invoice[]>();for(const inv of invoices){if(outstanding(inv)<=0)continue;const arr=groups.get(inv.customerId)||[];arr.push(inv);groups.set(inv.customerId,arr);}
 const jobs:{customerId:string;name:string;phone:string;message:string;invoiceIds:string[];invoiceNos:string[]}[]=[];
 for(const [cid,invs] of groups){const c=d.customers.find(x=>x.id===cid);if(!c)continue;
  if(opts.combined&&invs.length>1){
   const capped=invs.slice(0,15);const lines=capped.map(inv=>"- "+inv.number+": "+cur+" "+money(outstanding(inv))+", due "+displayDate(inv.due)+(daysOverdue(inv.due,now)>0?" (overdue)":""));if(invs.length>capped.length)lines.push("- ...and "+(invs.length-capped.length)+" more");
   const total=money(invs.reduce((n,i)=>n+outstanding(i),0));const message=combinedReminderSms(biz,cur,c.name,lines,total);
   jobs.push({customerId:cid,name:c.name,phone:c.phone||"",message,invoiceIds:invs.map(i=>i.id),invoiceNos:invs.map(i=>i.number)});
  }else{
   for(const inv of invs){const message=daysOverdue(inv.due,now)>0?reminderSms(biz,cur,c.name,inv.number,money(outstanding(inv)),displayDate(inv.due)):billSms(biz,cur,c.name,inv.number,money(inv.total),money(outstanding(inv)),displayDate(inv.due));jobs.push({customerId:cid,name:c.name,phone:c.phone||"",message,invoiceIds:[inv.id],invoiceNos:[inv.number]});}
  }
 }
 if(!jobs.length)return{results:[] as {customer:string;to:string;ok:boolean;error?:string;invoices:string[]}[],updated:null as Awaited<ReturnType<typeof commit>>|null};
 const settled=await Promise.all(jobs.slice(0,50).map(async j=>{const sent=j.phone?await sendSms(env,j.phone,j.message):{ok:false as boolean,error:"No phone number on file.",id:""};return{j,sent}}));
 const entries:Record<string,unknown>[]=settled.map(({j,sent})=>({date:now,kind:"reminder",invoiceId:j.invoiceIds.length===1?j.invoiceIds[0]:"",customerId:j.customerId,phone:j.phone,message:j.message,status:sent.ok?"sent":"failed",providerId:(sent as {id?:string}).id||"",error:sent.error||""}));
 const results=settled.map(({j,sent})=>({customer:j.name,to:j.phone,ok:sent.ok,error:sent.error,invoices:j.invoiceNos}));
 const payload:Record<string,unknown>={entries};if(opts.markSweep)payload.lastReminderRun=now;const updated=await commit({type:"smslog",requestId:uid("sms"),payload},w.revision);
 return{results,updated};
}
export async function sendCustomerSms(w:{data:LedgerData;actor:Actor;revision:number},customerId:string,message:string){
 const c=w.data.customers.find(x=>x.id===customerId);if(!c)throw new HttpError("Customer not found.",404);
 const text=String(message||"").trim().slice(0,900);if(!text)throw new HttpError("Enter a message to send.");
 const sent=c.phone?await sendSms(env,c.phone,text):{ok:false as boolean,error:"This customer has no phone number on file.",id:""};
 const updated=await commit({type:"smslog",requestId:uid("sms"),payload:{entries:[{date:today(w.data.business.timeZone),kind:"custom",invoiceId:"",customerId:c.id,phone:c.phone||"",message:text,status:sent.ok?"sent":"failed",providerId:(sent as {id?:string}).id||"",error:sent.error||""}]}},w.revision);
 return{ok:sent.ok,error:sent.error,to:c.phone||"",name:c.name,updated};
}
