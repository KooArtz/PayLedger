import {cookies} from "next/headers";
import {demoEnabled,signSession} from "@/lib/session";
import {response,errorResponse,sameOrigin,HttpError} from "@/lib/server";
export const dynamic="force-dynamic";
// Demo sign-in: one click signs in as the workspace owner, no password. Replace with real auth for production.
const DEMO={userId:"demo-unoosh",email:"unoosh@huvathu.mv",fullName:"Unoosh Ahmed"};
export async function POST(request:Request){try{
 sameOrigin(request);
 const body=await request.json().catch(()=>({})) as {action?:string};
 const jar=await cookies();
 if(body.action==="signout"){jar.delete("ledger_user");return response({ok:true});}
 if(!demoEnabled())throw new HttpError("Demo sign-in is disabled on this deployment. An administrator can explicitly enable LEDGER_DEMO_MODE for a demo site.",403);
 jar.set("ledger_user",signSession(DEMO),{httpOnly:true,sameSite:"lax",path:"/",secure:process.env.NODE_ENV==="production",maxAge:60*60*24*30});
 return response({ok:true,user:{name:DEMO.fullName}});
}catch(e){return errorResponse(e)}}
