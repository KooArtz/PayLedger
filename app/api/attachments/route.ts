import {response,errorResponse,sameOrigin,HttpError} from "@/lib/server";
export const dynamic="force-dynamic";
// Attachment uploads used Cloudflare R2. On Vercel this needs an object store (e.g. Vercel Blob).
// Until that's wired up, uploads are disabled gracefully so the rest of the app works.
export async function POST(request:Request){try{
 sameOrigin(request);
 throw new HttpError("Document uploads aren't enabled on this deployment yet. Connect Vercel Blob storage to turn them on.",503);
}catch(e){return errorResponse(e)}}
export async function GET(){try{
 throw new HttpError("Document not found.",404);
}catch(e){return errorResponse(e)}}
