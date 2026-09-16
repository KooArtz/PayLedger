export type Role="Super admin"|"Manager"|"Sales staff"|"Accounts"|"Customer";
export type Method="Cash"|"Bank transfer"|"Credit";
export type Customer={id:string;name:string;phone:string;email:string;island:string;address:string;business:string;tier:string;limit:number;approved:boolean;created:string};
export type Product={id:string;name:string;code:string;category:string;cost:number;price:number;stock:number;reorder:number;unit:string;barcode:string;rates:Record<string,number>};
export type Line={productId:string;name:string;qty:number;price:number;cost:number;unit:string};
export type Invoice={id:string;number:string;date:string;due:string;customerId:string;items:Line[];discount:number;vat:number;subtotal:number;tax:number;total:number;paid:number;method:Method;po:string;remarks:string;createdBy:string};
export type Payment={id:string;invoiceId:string;date:string;amount:number;method:string;reference:string};
export type Delivery={id:string;number:string;invoiceId:string;customerId:string;po:string;date:string;vehicle:string;driver:string;signature:string;status:string};
export type Order={id:string;number:string;customerId:string;date:string;amount:number;status:string;notes:string};
export type Reading={id:string;date:string;productId:string;start:number;end:number;liters:number;recordedLiters:number;difference:number;notes:string};
export type Comment={id:string;invoiceId:string;customerId:string;author:string;date:string;text:string};
export type Attachment={id:string;entityId:string;customerId:string;name:string;size:number;mime:string;date:string;author:string};
export type Member={id:string;name:string;email:string;role:Role;customerId:string;permissions:string[]};
export type Audit={id:string;date:string;actor:string;action:string;record:string;before:string;after:string;fingerprint?:string;result?:Record<string,unknown>};
export type Expense={id:string;date:string;category:string;amount:number;notes:string};
export type SavedReport={id:string;name:string;from:string;to:string;customerId:string;productId:string;island:string;method:string;salesperson:string;created:string;createdBy:string};
export type Sms={id:string;date:string;kind:"payment"|"reminder"|"custom"|"sale";invoiceId:string;customerId:string;phone:string;message:string;status:"sent"|"failed";providerId?:string;error?:string;by:string};
export type Business={name:string;currency:string;timeZone:string;vat:number;creditReminders:boolean;stockAlerts:boolean};
export type LedgerData={business:Business;customers:Customer[];products:Product[];invoices:Invoice[];payments:Payment[];deliveries:Delivery[];orders:Order[];readings:Reading[];comments:Comment[];attachments:Attachment[];members:Member[];audit:Audit[];expenses:Expense[];reports:SavedReport[];sms:Sms[];reminders?:{lastRun?:string};sample:boolean};
export type Actor={userId:string;name:string;email:string;role:Role;customerId:string;permissions:string[]};
export const roles:Role[]=["Super admin","Manager","Sales staff","Accounts","Customer"];
export const permissions:Record<Role,string[]>={"Super admin":["sale","customer","product","payment","delivery","order","reading","report","expense","credit","member","settings","comment","attachment","backup"],Manager:["sale","customer","product","payment","delivery","order","reading","report","expense","credit","comment","attachment"],"Sales staff":["sale","comment"],Accounts:["payment","report","expense","comment","attachment"],Customer:["comment","orderRequest","attachment"]};
export const can=(actor:Actor|null,action:string)=>!!actor&&(permissions[actor.role].includes(action)||actor.permissions.includes(action));
export const round=(n:number)=>Math.round((n+Number.EPSILON)*100)/100;
export const money=(n:number)=>new Intl.NumberFormat("en-US",{minimumFractionDigits:n%1?2:0,maximumFractionDigits:2}).format(n||0);
export const today=(zone="Indian/Maldives")=>new Intl.DateTimeFormat("en-CA",{timeZone:zone,year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
export function dateShift(date:string,n:number){const d=new Date(date+"T12:00:00Z");d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10)}
export function validDate(s:string){if(!/^\d{4}-\d{2}-\d{2}$/.test(s))return false;const d=new Date(s+"T12:00:00Z");return !isNaN(d.valueOf())&&d.toISOString().slice(0,10)===s}
export const displayDate=(s:string)=>new Date(s.slice(0,10)+"T12:00:00Z").toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"});
export const initials=(s:string)=>s.split(" ").filter(Boolean).slice(0,2).map(x=>x[0]).join("").toUpperCase();
export const customerName=(d:LedgerData,id:string)=>d.customers.find(c=>c.id===id)?.name||"Walk-in customer";
export const outstanding=(i:Invoice)=>round(Math.max(0,i.total-i.paid));
export const balance=(d:LedgerData,id:string)=>round(d.invoices.filter(i=>i.customerId===id).reduce((n,i)=>n+outstanding(i),0));
export const invoiceStatus=(i:Invoice,now=today())=>outstanding(i)<.01?"Paid":i.due<now?"Overdue":i.paid>0?"Part paid":"Credit";
export const daysOverdue=(due:string,now:string)=>Math.floor((new Date(now+"T12:00:00Z").valueOf()-new Date(due+"T12:00:00Z").valueOf())/86400000);
export const uid=(prefix:string)=>prefix+"-"+crypto.randomUUID().slice(0,12);
export function emptyData():LedgerData{return{business:{name:"Huvathu Pvt",currency:"MVR",timeZone:"Indian/Maldives",vat:0,creditReminders:true,stockAlerts:true},customers:[],products:[],invoices:[],payments:[],deliveries:[],orders:[],readings:[],comments:[],attachments:[],members:[],audit:[],expenses:[],reports:[],sms:[],reminders:{lastRun:""},sample:false}}
export function sampleData(now=today()):LedgerData{
 const d=emptyData();d.sample=true;
 const names=[["Ocean View Resort","Hulhumalé","Wholesale"],["Ahmed Hassan","Malé","Retail"],["Maafushi Hardware","Maafushi","Contractor"],["Island School","Gulhi","School"],["Blue Lagoon Café","Maafushi","VIP"],["Sunrise Construction","Malé","Contractor"],["Palm Guesthouse","Thulusdhoo","Wholesale"],["Rasheed Store","Gulhi","Retail"]];
 d.customers=names.map(([name,island,tier],i)=>({id:"c"+(i+1),name,island,tier,phone:"+960 777 "+String(1200+i),email:name.toLowerCase().replaceAll(" ",".")+"@example.com",address:island+", Maldives",business:name,limit:[90000,20000,85000,60000,45000,100000,40000,18000][i],approved:true,created:dateShift(now,-80+i*4)}));
 d.products=[["Diesel","FL-001","Fuel",13,16.5,14280,2500,"L"],["Petrol","FL-002","Fuel",12,15.8,1280,1500,"L"],["Portland cement","BL-001","Building materials",105,135,24,30,"bag"],["Marine engine oil","AU-001","Automotive",195,250,9,12,"bottle"],["A4 copy paper","ST-001","Stationery",42,65,16,20,"ream"],["Drinking water 1.5L","GR-001","Grocery",58,85,146,30,"case"],["Steel reinforcement 12mm","BL-002","Building materials",96,130,180,40,"piece"],["Paint · Ocean white","BL-003","Building materials",280,375,42,10,"tin"]].map((p,i)=>({id:"p"+(i+1),name:String(p[0]),code:String(p[1]),category:String(p[2]),cost:Number(p[3]),price:Number(p[4]),stock:Number(p[5]),reorder:Number(p[6]),unit:String(p[7]),barcode:"89010000000"+i,rates:{Retail:Number(p[4]),Wholesale:round(Number(p[4])*.94),VIP:round(Number(p[4])*.92),Contractor:round(Number(p[4])*.93),School:round(Number(p[4])*.9)}}));
 for(let day=42;day>=0;day--){const count=day===0?8:3+(day%4);for(let j=0;j<count;j++){const p=d.products[(day+j*3)%d.products.length];const c=d.customers[(day+j)%d.customers.length];const qty=p.category==="Fuel"?180+(day*17+j*45)%800:8+(day*3+j*4)%48;const price=p.rates[c.tier];const total=round(qty*price);const method:Method=["Cash","Bank transfer","Credit"][(day+j)%3] as Method;const date=dateShift(now,-day);const n=d.invoices.length+101;const paid=method==="Credit"?(day>25&&j%2===0?round(total*.4):0):total;const invoice:Invoice={id:"i"+n,number:"INV-"+String(n).padStart(4,"0"),date,due:dateShift(date,14),customerId:c.id,items:[{productId:p.id,name:p.name,qty,price,cost:p.cost,unit:p.unit}],discount:0,vat:0,subtotal:total,tax:0,total,paid,method,po:j%2===0?"PO-"+(240+day):"",remarks:"",createdBy:"Unoosh Ahmed"};d.invoices.unshift(invoice);if(paid)d.payments.unshift({id:"pay"+n,invoiceId:invoice.id,date:method==="Credit"?dateShift(date,12):date,amount:paid,method:method==="Credit"?"Bank transfer":method,reference:method==="Bank transfer"?"TRF-"+n:""});}}
 d.deliveries=d.invoices.slice(0,7).map((i,n)=>({id:"d"+n,number:"DN-"+String(121+n).padStart(4,"0"),invoiceId:i.id,customerId:i.customerId,po:i.po,date:i.date,vehicle:["A-4521","B-8920"][n%2],driver:["Ibrahim Ali","Mohamed Zahir"][n%2],signature:n>2?"Received by customer":"",status:n>2?"Delivered":n===0?"Preparing":"In transit"}));
 d.orders=[{id:"o1",number:"PO-0301",customerId:"c1",date:now,amount:24500,status:"Approved",notes:"Monthly fuel supply"},{id:"o2",number:"PO-0302",customerId:"c3",date:dateShift(now,-1),amount:12800,status:"Pending",notes:"Cement and reinforcement"},{id:"o3",number:"PO-0303",customerId:"c4",date:dateShift(now,-2),amount:3900,status:"Fulfilled",notes:"School stationery order"}];
 for(let n=6;n>=0;n--){const date=dateShift(now,-n);const liters=d.invoices.filter(i=>i.date===date).reduce((sum,i)=>sum+i.items.filter(l=>l.productId==="p1").reduce((v,l)=>v+l.qty,0),0);d.readings.unshift({id:"r"+n,date,productId:"p1",start:54230+(6-n)*950,end:54230+(6-n)*950+liters+(n===1?3:0),liters:liters+(n===1?3:0),recordedLiters:liters,difference:n===1?3:0,notes:n===1?"Recheck pump log":""});}
 d.expenses=[{id:"e1",date:dateShift(now,-2),category:"Transport",amount:850,notes:"Island delivery"},{id:"e2",date:dateShift(now,-5),category:"Utilities",amount:1450,notes:"Electricity"}];
 d.audit=[{id:"a1",date:new Date().toISOString(),actor:"Ledger",action:"Sample workspace created",record:"Workspace",before:"",after:"Fictional sample records loaded"}];
 const sp=d.payments[0];if(sp){const si=d.invoices.find(i=>i.id===sp.invoiceId);const sc=si?d.customers.find(c=>c.id===si.customerId):undefined;if(si&&sc)d.sms=[{id:uid("sms"),date:sp.date,kind:"payment",invoiceId:si.id,customerId:sc.id,phone:sc.phone,message:"Dear "+sc.name+", we received your payment of "+d.business.currency+" "+money(sp.amount)+" for "+si.number+". Thank you. - "+d.business.name,status:"sent",providerId:"sample",by:"Unoosh Ahmed"}];}
 return d;
}
export type ReportFilters={from:string;to:string;customerId?:string;productId?:string;method?:string;island?:string;salesperson?:string};
export function calculateReport(d:LedgerData,f:ReportFilters){
 if(!validDate(f.from)||!validDate(f.to))throw new Error("Choose valid start and end dates.");if(f.from>f.to)throw new Error("The start date must be on or before the end date.");
 const match=(i:Invoice)=> (!f.customerId||i.customerId===f.customerId)&&(!f.method||i.method===f.method)&&(!f.island||d.customers.find(c=>c.id===i.customerId)?.island===f.island)&&(!f.salesperson||i.createdBy===f.salesperson)&&(!f.productId||i.items.some(l=>l.productId===f.productId));
 const invoices=d.invoices.filter(i=>i.date>=f.from&&i.date<=f.to&&match(i));
 // Product filters include complete matching invoices, preserving tax/payment reconciliation.
 const sum=(items:Invoice[])=>round(items.reduce((n,i)=>n+i.total,0));
 const payments=d.payments.filter(p=>p.date>=f.from&&p.date<=f.to&&d.invoices.some(i=>i.id===p.invoiceId&&match(i)));
 const sales=sum(invoices),tax=round(invoices.reduce((n,i)=>n+i.tax,0)),cost=round(invoices.reduce((n,i)=>n+i.items.reduce((s,l)=>s+l.cost*l.qty,0),0));
 const expenses=round(d.expenses.filter(e=>e.date>=f.from&&e.date<=f.to).reduce((n,e)=>n+e.amount,0));
 const asOf=d.invoices.filter(i=>i.date<=f.to&&match(i)).reduce((n,i)=>n+Math.max(0,i.total-d.payments.filter(p=>p.invoiceId===i.id&&p.date<=f.to).reduce((s,p)=>s+p.amount,0)),0);
 const customers=d.customers.map(c=>({name:c.name,total:sum(invoices.filter(i=>i.customerId===c.id))})).filter(c=>c.total>0).sort((a,b)=>b.total-a.total);
 const products=d.products.map(p=>({name:p.name,total:round(invoices.reduce((n,i)=>n+i.items.filter(l=>l.productId===p.id).reduce((s,l)=>s+l.qty*l.price,0),0))})).filter(p=>p.total>0).sort((a,b)=>b.total-a.total);
 return {...f,invoices,sales,cash:sum(invoices.filter(i=>i.method==="Cash")),transfer:sum(invoices.filter(i=>i.method==="Bank transfer")),credit:sum(invoices.filter(i=>i.method==="Credit")),collections:round(payments.reduce((n,p)=>n+p.amount,0)),outstanding:round(asOf),tax,cost,grossProfit:round(sales-tax-cost),expenses,netProfit:round(sales-tax-cost-expenses),liters:round(invoices.reduce((n,i)=>n+i.items.filter(l=>l.unit==="L").reduce((s,l)=>s+l.qty,0),0)),meterDifference:round(d.readings.filter(r=>r.date>=f.from&&r.date<=f.to&&(!f.productId||r.productId===f.productId)).reduce((n,r)=>n+r.difference,0)),customers,products,payments};
}
