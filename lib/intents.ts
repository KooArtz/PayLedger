import {validDate,dateShift,type ReportFilters} from "./model";
export type Intent={type:"report";filters:ReportFilters}|{type:"clarify";message:string}|{type:"lowStock"}|{type:"credit";overdue:boolean}|{type:"customers";query:string}|{type:"navigate";page:string}|{type:"start";form:string}|{type:"remind";query:string;all:boolean}|{type:"chat"};
export function parseIntent(message:string,now:string):Intent{
 const s=message.toLowerCase().trim();
 if(/\b(report|statement|export|sales summary|sales between|sales from)\b/.test(s)){
  let from=now.slice(0,7)+"-01",to=now;
  const dates=[...s.matchAll(/\b(\d{4}-\d{2}-\d{2})\b/g)].map(x=>x[1]);
  const nonIso=s.replace(/\b\d{4}-\d{2}-\d{2}\b/g,"");
  if(/\b\d{1,4}[\/.-]\d{1,2}(?:[\/.-]\d{1,4})?\b/.test(nonIso))return{type:"clarify",message:"Please use YYYY-MM-DD for every date in the range, so I don't confuse day and month."};
  const months=["january","february","march","april","may","june","july","august","september","october","november","december"];
  const monthNames="january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec";
  if(!dates.length){const regex=new RegExp("\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+("+monthNames+")(?:\\s+(\\d{4}))?\\b|\\b("+monthNames+")\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:,?\\s+(\\d{4}))?\\b","g");for(const match of s.matchAll(regex)){const day=match[1]||match[5],mon=match[2]||match[4],year=match[3]||match[6]||now.slice(0,4);dates.push(year+"-"+String(months.findIndex(m=>m.startsWith(mon.slice(0,3)))+1).padStart(2,"0")+"-"+day.padStart(2,"0"));}}
  if(dates.length){if(dates.some(d=>!validDate(d)))return{type:"clarify",message:"One of those dates is not valid. Please use YYYY-MM-DD, for example 2026-09-01."};if(dates.length>2)return{type:"clarify",message:"Please give one start date and one end date."};if(dates.length===1&&/\b(from|between|through|until|to)\b/.test(s))return{type:"clarify",message:"Please include both dates, for example: report from 2026-09-01 to 2026-09-15."};from=dates[0];to=dates[1]||dates[0];}
  else if(/\b\d{1,4}[\/.-]\d{1,2}(?:[\/.-]\d{1,4})?\b|\b(from|between|until)\b/.test(s))return{type:"clarify",message:"Please give the dates as YYYY-MM-DD so I use the right range."};
  else if(/last (\d+) days/.test(s)){const days=Number(s.match(/last (\d+) days/)![1]);if(days<1||days>3660)return{type:"clarify",message:"Choose a range between 1 and 3,660 days."};from=dateShift(now,1-days)}
  else if(/last month/.test(s)){to=dateShift(now.slice(0,7)+"-01",-1);from=to.slice(0,7)+"-01"}
  else if(/this week/.test(s)){const day=new Date(now+"T12:00:00Z").getUTCDay();from=dateShift(now,-((day+6)%7))}
  else if(/last week/.test(s)){const day=new Date(now+"T12:00:00Z").getUTCDay();to=dateShift(now,-((day+6)%7)-1);from=dateShift(to,-6)}
  else if(/last year/.test(s)){const year=Number(now.slice(0,4))-1;from=year+"-01-01";to=year+"-12-31"}
  else if(/this year/.test(s))from=now.slice(0,4)+"-01-01";
  else if(/yesterday/.test(s))from=to=dateShift(now,-1);
  else if(/today|daily/.test(s))from=to=now;
  else if(new RegExp("\\b("+monthNames+")\\b").test(s)){const match=s.match(new RegExp("\\b("+monthNames+")(?:\\s+(\\d{4}))?\\b"))!;const year=Number(match[2]||now.slice(0,4)),month=months.findIndex(m=>m.startsWith(match[1].slice(0,3)));from=year+"-"+String(month+1).padStart(2,"0")+"-01";to=new Date(Date.UTC(year,month+1,0,12)).toISOString().slice(0,10);}
  else if(/\b(quarter|year|week|last|previous|next|since|before|after)\b|\b\d{4}\b/.test(s))return{type:"clarify",message:"Please give a start and end date in YYYY-MM-DD format for that reporting period."};
  if(from>to)return{type:"clarify",message:"The start date is after the end date. Please put the earlier date first."};
  return{type:"report",filters:{from,to,method:/\bcash\b/.test(s)?"Cash":/\btransfer\b/.test(s)?"Bank transfer":/\bcredit\b/.test(s)?"Credit":""}};
 }
 if(/\b(remind|reminder|send (?:a |an )?(?:sms|text|reminder|bill|message)|chase)\b/.test(s))return{type:"remind",query:s,all:/\b(all|everyone|every|overdue|outstanding|due)\b/.test(s)};
 if(/low stock|running low|reorder|out of stock|check stock/.test(s))return{type:"lowStock"};
 if(/overdue|outstanding|who (owes|has)|unpaid|credit balance/.test(s))return{type:"credit",overdue:/overdue/.test(s)};
 const customer=s.match(/(?:find|search|look up|show) (?:customer|client)(?: named)?\s+(.+)/);if(customer)return{type:"customers",query:customer[1]};
 if(/\b(create|new|make|add) (an? )?(sale|invoice)\b/.test(s))return{type:"start",form:"sale"};
 if(/\b(record|add|collect) (a )?payment\b/.test(s))return{type:"start",form:"payment"};
 if(/\b(add|new|create) (a )?customer\b/.test(s))return{type:"start",form:"customer"};
 const pages:Record<string,string>={dashboard:"Overview",overview:"Overview",sales:"Sales & invoices",invoices:"Sales & invoices",customers:"Customers",inventory:"Products & stock",products:"Products & stock",deliveries:"Delivery notes",fuel:"Fuel readings",reports:"Reports",settings:"Settings"};const nav=s.match(/^(?:open|go to|show me|take me to) (?:the )?(.+?)(?: page)?[.!]?$/);if(nav&&pages[nav[1]])return{type:"navigate",page:pages[nav[1]]};
 return{type:"chat"};
}
