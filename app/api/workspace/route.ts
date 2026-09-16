import {env} from "@/lib/env";
import {workspace,response,errorResponse,commit,sameOrigin,HttpError,sendReminders} from "@/lib/server";
import {visibleData} from "@/lib/operations";
import {today,outstanding,money,daysOverdue} from "@/lib/model";
import {smsConfigured,sendSms,paymentSms,saleSms,billSms} from "@/lib/sms";
export const dynamic="force-dynamic";
// Automatic backend reminders: any invoice 20+ days overdue is texted once (deduped for 7 days). Runs at most once per day.
async function sweepDueReminders(w:Awaited<ReturnType<typeof workspace>>){
 if(!smsConfigured(env)||!w.data.business.creditReminders)return false;
 const now=today(w.data.business.timeZone);if(w.data.reminders?.lastRun===now)return false;
 const log=w.data.sms||[];const remindedRecently=(id:string)=>log.some(s=>s.kind==="reminder"&&s.invoiceId===id&&daysOverdue(s.date,now)<7);
 const due=w.data.invoices.filter(i=>outstanding(i)>0&&daysOverdue(i.due,now)>=20&&!remindedRecently(i.id));
 if(!due.length)return false;
 try{await sendReminders(w,due,{combined:true,markSweep:true});return true}catch{return false}
}
export async function GET(){try{const w0=await workspace();const swept=await sweepDueReminders(w0).catch(()=>false);const w=swept?await workspace():w0;return response({...w,data:visibleData(w.data,w.actor)})}catch(e){return errorResponse(e)}}
export async function POST(request:Request){try{sameOrigin(request);const body=await request.json() as any;if(typeof body.type!=="string"||!body.payload||!Number.isInteger(body.revision)||typeof body.requestId!=="string"||body.requestId.length>100)throw new HttpError("Invalid request.");
 const res=await commit(body,body.revision);
 // Auto payment-confirmation SMS after a successful (non-duplicate) payment.
 if(body.type==="payment"&&smsConfigured(env)&&!(res.result as {duplicate?:boolean})?.duplicate){try{
  const w=await workspace();const inv=w.data.invoices.find(i=>i.id===(res.result as {id?:string})?.id);const c=inv?w.data.customers.find(x=>x.id===inv.customerId):undefined;
  if(inv&&c&&c.phone){const amount=Number((body.payload as {amount?:unknown}).amount)||0;const msg=paymentSms(w.data.business.name,w.data.business.currency,c.name,inv.number,money(amount),money(outstanding(inv)));const sent=await sendSms(env,c.phone,msg);
   const logged=await commit({type:"smslog",requestId:body.requestId+"-sms",payload:{entries:[{date:today(w.data.business.timeZone),kind:"payment",invoiceId:inv.id,customerId:c.id,phone:c.phone,message:msg,status:sent.ok?"sent":"failed",providerId:sent.id||"",error:sent.error||""}]}},w.revision);
   return response({...logged,result:res.result,sms:{sent:sent.ok,to:c.phone,error:sent.error}});}
 }catch(e){console.error("Payment SMS failed:",e instanceof Error?e.message:e)}}
 // Auto notification after a new sale: a paid-in-full receipt, or a new-bill notice for a credit sale.
 if(body.type==="sale"&&smsConfigured(env)&&!(res.result as {duplicate?:boolean})?.duplicate){try{
  const w=await workspace();const inv=w.data.invoices.find(i=>i.id===(res.result as {id?:string})?.id);const c=inv?w.data.customers.find(x=>x.id===inv.customerId):undefined;
  if(inv&&c&&c.phone){const cur=w.data.business.currency,biz=w.data.business.name;const msg=outstanding(inv)<=0?saleSms(biz,cur,c.name,inv.number,money(inv.total),inv.method):billSms(biz,cur,c.name,inv.number,money(inv.total),money(outstanding(inv)),inv.due);const sent=await sendSms(env,c.phone,msg);
   const logged=await commit({type:"smslog",requestId:body.requestId+"-sms",payload:{entries:[{date:today(w.data.business.timeZone),kind:"sale",invoiceId:inv.id,customerId:c.id,phone:c.phone,message:msg,status:sent.ok?"sent":"failed",providerId:sent.id||"",error:sent.error||""}]}},w.revision);
   return response({...logged,result:res.result,sms:{sent:sent.ok,to:c.phone,error:sent.error}});}
 }catch(e){console.error("Sale SMS failed:",e instanceof Error?e.message:e)}}
 return response(res);
}catch(e){return errorResponse(e)}}
