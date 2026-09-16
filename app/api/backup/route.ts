import {workspace,errorResponse,HttpError} from "@/lib/server";
import {can} from "@/lib/model";
export async function GET(){try{const w=await workspace();if(!can(w.actor,"backup"))throw new HttpError("Only the administrator can export a full backup.",403);return new Response(JSON.stringify({version:1,exportedAt:new Date().toISOString(),data:w.data},null,2),{headers:{"Content-Type":"application/json","Content-Disposition":"attachment; filename=ledger-backup.json","Cache-Control":"no-store"}})}catch(e){return errorResponse(e)}}
