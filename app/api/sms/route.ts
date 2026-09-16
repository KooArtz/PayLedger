import {env} from "@/lib/env";
import {workspace,response,errorResponse,sameOrigin,HttpError,sendReminders,sendCustomerSms} from "@/lib/server";
import {visibleData} from "@/lib/operations";
import {today,outstanding,daysOverdue,can,type Invoice} from "@/lib/model";
import {smsConfigured,smsStatus,deviceId} from "@/lib/sms";
export const dynamic="force-dynamic";
// GET: SMS connection + balance status (for the Settings card).
export async function GET(){try{
 const w=await workspace();if(!can(w.actor,"payment")&&!can(w.actor,"credit")&&!can(w.actor,"report"))throw new HttpError("Not allowed.",403);
 const proc=(k:string)=>{try{return typeof process!=="undefined"&&!!process.env&&!!process.env[k]}catch{return false}};
 const diag={keyEnv:!!(env&&env.TEXTBEE_API_KEY),keyProc:proc("TEXTBEE_API_KEY"),deviceSet:!!deviceId(env),geminiEnv:!!(env&&env.GEMINI_API_KEY),geminiProc:proc("GEMINI_API_KEY")};
 if(!smsConfigured(env))return response({configured:false,diag});
 const st=await smsStatus(env);
 return response({configured:true,provider:"TextBee",deviceSet:!!deviceId(env),devices:st.ok?st.devices:undefined,error:st.ok?undefined:st.error,diag});
}catch(e){return errorResponse(e)}}
// POST: manual reminders. {mode:"invoice",invoiceId} for one; {mode:"due",days?} for a batch (days=0 = every overdue invoice).
export async function POST(request:Request){try{
 sameOrigin(request);const w=await workspace();
 if(!can(w.actor,"payment")&&!can(w.actor,"credit"))throw new HttpError("Your role cannot send SMS reminders.",403);
 if(!smsConfigured(env))throw new HttpError("SMS is not configured. Add TEXTBEE_API_KEY (and TEXTBEE_DEVICE_ID) to the server env, then restart the app.",503);
 const body=await request.json().catch(()=>({})) as {mode?:string;invoiceId?:string;customerId?:string;invoiceIds?:string[];message?:string;days?:number;combined?:boolean};
 if(body.mode==="custom"){const r=await sendCustomerSms(w,String(body.customerId||""),String(body.message||""));const ws=r.updated||{...w,data:visibleData(w.data,w.actor)};return response({sent:r.ok?1:0,failed:r.ok?0:1,results:[{customer:r.name,to:r.to,ok:r.ok,error:r.error}],text:r.ok?"Message sent to "+r.name+".":"Could not send: "+(r.error||"unknown error"),workspace:ws});}
 const now=today(w.data.business.timeZone);const combined=body.combined!==false;let targets:Invoice[];
 if(body.mode==="invoice"){const inv=w.data.invoices.find(i=>i.id===body.invoiceId);if(!inv)throw new HttpError("Invoice not found.",404);if(outstanding(inv)<=0)throw new HttpError("This invoice is already fully paid.");targets=[inv];}
 else if(body.mode==="selected"){const ids=Array.isArray(body.invoiceIds)?body.invoiceIds:[];targets=w.data.invoices.filter(i=>ids.includes(i.id)&&outstanding(i)>0&&(!body.customerId||i.customerId===body.customerId));}
 else if(body.mode==="outstanding"){targets=w.data.invoices.filter(i=>outstanding(i)>0&&(!body.customerId||i.customerId===body.customerId));}
 else{const min=Number.isFinite(body.days)?Number(body.days):0;targets=w.data.invoices.filter(i=>outstanding(i)>0&&i.due<now&&daysOverdue(i.due,now)>=min&&(!body.customerId||i.customerId===body.customerId));}
 if(!targets.length)return response({sent:0,failed:0,results:[],text:"No matching invoices to remind.",workspace:{...w,data:visibleData(w.data,w.actor)}});
 const {results,updated}=await sendReminders(w,targets,{combined});
 const sent=results.filter(r=>r.ok).length;const failed=results.length-sent;const ws=updated||{...w,data:visibleData(w.data,w.actor)};
 return response({sent,failed,results,text:sent+" SMS sent"+(failed?", "+failed+" could not be delivered":"")+".",workspace:ws});
}catch(e){return errorResponse(e)}}
