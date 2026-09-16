// TextBee SMS gateway (https://textbee.dev). Messages are sent through your registered Android device.
// Credentials live only on the server (env), never in the client bundle.
// Reads from the Cloudflare worker env binding AND process.env, so it works on Cloudflare, Vercel, or Node.
//
// SENDER NAME: TextBee is a phone-based gateway, so the recipient always sees the SIM's phone number as the
// sender — a custom alphanumeric sender ID (e.g. "Huvathu Pvt") is a carrier-route feature that a phone
// cannot set. To make the business identity clear regardless, every message below LEADS with the business
// name, so the first thing the recipient reads is "Huvathu Pvt: ...".
export type SmsEnv={TEXTBEE_API_KEY?:string;TEXTBEE_DEVICE_ID?:string};
function envVar(env:SmsEnv,key:"TEXTBEE_API_KEY"|"TEXTBEE_DEVICE_ID"):string{const a=env?env[key]:"";let b:string|undefined;try{b=(typeof process!=="undefined"&&process.env)?process.env[key]:undefined}catch{b=undefined}return String(a||b||"").trim();}
export const apiKey=(env:SmsEnv)=>envVar(env,"TEXTBEE_API_KEY");
export const deviceId=(env:SmsEnv)=>envVar(env,"TEXTBEE_DEVICE_ID");
export const smsConfigured=(env:SmsEnv)=>!!apiKey(env);
const BASE="https://api.textbee.dev/api/v1";
// Best-effort E.164 normalisation. Maldives (+960) is assumed for bare 7-digit local numbers.
export function normalizePhone(raw:string):string{
 const t=(raw||"").replace(/[()\s-]/g,"");if(!t)return "";
 if(t.startsWith("+"))return t;
 if(t.startsWith("00"))return "+"+t.slice(2);
 if(t.startsWith("960"))return "+"+t;
 if(/^\d{7}$/.test(t))return "+960"+t;
 return "+"+t.replace(/^0+/,"");
}
export type SmsResult={ok:boolean;id?:string;error?:string};
export async function sendSms(env:SmsEnv,to:string,message:string):Promise<SmsResult>{
 const key=apiKey(env);if(!key)return{ok:false,error:"SMS is not configured on the server (missing TEXTBEE_API_KEY)."};
 const phone=normalizePhone(to);if(!phone||phone.replace(/\D/g,"").length<7)return{ok:false,error:"No valid phone number for this customer."};
 const dev=deviceId(env);const url=dev?BASE+"/gateway/devices/"+encodeURIComponent(dev)+"/send-sms":BASE+"/gateway/send-sms";
 try{
  const r=await fetch(url,{method:"POST",headers:{"x-api-key":key,"Content-Type":"application/json","Accept":"application/json"},body:JSON.stringify({recipients:[phone],message:String(message).slice(0,900)}),signal:AbortSignal.timeout(15000)});
  const data=await r.json().catch(()=>({})) as any;
  if(!r.ok||data?.success===false||data?.error){let msg=(data&&(data.message||data.error))||("TextBee returned status "+r.status);if(typeof msg!=="string")msg=JSON.stringify(msg);if(r.status===404&&!dev)msg="No device found. Add your TextBee device ID as TEXTBEE_DEVICE_ID.";if(r.status===401||r.status===403)msg="TextBee rejected the API key. Check TEXTBEE_API_KEY.";return{ok:false,error:String(msg).slice(0,300)}}
  const id=data?.data?._id||data?.data?.id||data?.data?.smsBatchId||data?.messageId||"";return{ok:true,id:String(id)};
 }catch(e){const name=e instanceof Error?e.name:"";return{ok:false,error:name==="TimeoutError"||name==="AbortError"?"TextBee timed out.":(e instanceof Error?e.message:"SMS send failed.")}}
}
// Verifies the API key and lists the registered device(s) so the dashboard can confirm the gateway is connected.
export async function smsStatus(env:SmsEnv):Promise<{ok:boolean;devices?:{id:string;name:string}[];error?:string}>{
 const key=apiKey(env);if(!key)return{ok:false,error:"Not configured."};
 try{
  const r=await fetch(BASE+"/gateway/devices",{headers:{"x-api-key":key,"Accept":"application/json"},signal:AbortSignal.timeout(12000)});
  const data=await r.json().catch(()=>({})) as any;if(!r.ok)return{ok:false,error:"TextBee returned status "+r.status};
  const list=(Array.isArray(data)?data:(data?.data||data?.devices||[])) as any[];
  return{ok:true,devices:(Array.isArray(list)?list:[]).map(d=>({id:String(d?._id||d?.id||""),name:String((d?.brand?d.brand+" "+(d.model||""):d?.name||d?.model||"Device")).trim()}))};
 }catch{return{ok:false,error:"Could not reach TextBee."}}
}
// ---- Notification message templates (every SMS the app can send) ----
// Every template LEADS with the business name (see note at top): the recipient sees the SIM's phone number
// as the sender, so "Huvathu Pvt: ..." at the start is how they know who the message is from.
// Sale completed and paid in full (cash / bank transfer) — a receipt / thank-you.
export function saleSms(business:string,currency:string,name:string,invoiceNo:string,total:string,method:string):string{
 return `${business}: Dear ${name}, thank you for your purchase. Invoice ${invoiceNo}: ${currency} ${total} (paid by ${method}). We appreciate your business.`;
}
// Payment received against an existing invoice.
export function paymentSms(business:string,currency:string,name:string,invoiceNo:string,amount:string,balance:string):string{
 return `${business}: Dear ${name}, we received your payment of ${currency} ${amount} for ${invoiceNo}. Outstanding balance: ${currency} ${balance}. Thank you.`;
}
// Reminder for a bill that is not yet overdue (also used for a new credit sale).
export function billSms(business:string,currency:string,name:string,invoiceNo:string,total:string,balance:string,due:string):string{
 return `${business}: Dear ${name}, a reminder for invoice ${invoiceNo}: bill total ${currency} ${total}, outstanding balance ${currency} ${balance}, due on ${due}. Thank you for your business.`;
}
// Reminder for a bill that is past its due date.
export function reminderSms(business:string,currency:string,name:string,invoiceNo:string,balance:string,due:string):string{
 return `${business}: Dear ${name}, invoice ${invoiceNo} for ${currency} ${balance} was due on ${due} and is now overdue. Kindly arrange payment. Thank you.`;
}
// One reminder covering several invoices for the same customer.
export function combinedReminderSms(business:string,currency:string,name:string,lines:string[],total:string):string{
 return `${business}: Dear ${name}, a reminder for the following invoice(s):\n`+lines.join("\n")+`\nTotal outstanding: ${currency} ${total}. Kindly arrange payment. Thank you.`;
}
