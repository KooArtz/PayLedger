// A workspace JSON document in Upstash Redis, with a local file backend for development.
// Every mutation is atomic: Redis Lua compare-and-set or a file lock plus rename.
import {promises as fs} from "node:fs";
import path from "node:path";
import {randomUUID} from "node:crypto";
function creds(){return {url:(process.env.KV_REST_API_URL||process.env.UPSTASH_REDIS_REST_URL||"").replace(/\/$/,""),token:process.env.KV_REST_API_TOKEN||process.env.UPSTASH_REDIS_REST_TOKEN||""}}
export const kvConfigured=()=>{const {url,token}=creds();return !!(url&&token)};
function mode():"kv"|"file"{if(kvConfigured())return "kv";if(!process.env.VERCEL&&process.env.NODE_ENV!=="production")return "file";throw new Error("Storage is not configured. Set KV_REST_API_URL and KV_REST_API_TOKEN.")}
async function kvCmd(args:(string|number)[]):Promise<any>{const {url,token}=creds();const r=await fetch(url,{method:"POST",headers:{Authorization:"Bearer "+token,"Content-Type":"application/json"},body:JSON.stringify(args),signal:AbortSignal.timeout(15000)});const d=await r.json().catch(()=>({})) as any;if(!r.ok||d?.error)throw new Error("Storage request failed ("+r.status+"). Please try again.");return d?.result}
const FILE=path.join(process.env.LEDGER_LOCAL_DATA_DIR||path.join(process.cwd(),".local-data"),"store.json");
async function fileReadAll():Promise<Record<string,unknown>>{try{const parsed=JSON.parse(await fs.readFile(FILE,"utf8"));if(!parsed||Array.isArray(parsed)||typeof parsed!=="object")throw new Error("Invalid local store.");return parsed;}catch(e){if((e as NodeJS.ErrnoException).code==="ENOENT")return {};throw new Error("Local storage could not be read. Existing data has been preserved.");}}
async function fileWriteAll(data:Record<string,unknown>){const tmp=FILE+"."+randomUUID()+".tmp";try{await fs.writeFile(tmp,JSON.stringify(data),{encoding:"utf8",mode:0o600});await fs.rename(tmp,FILE)}finally{await fs.unlink(tmp).catch(()=>{})}}
async function withFileLock<T>(fn:()=>Promise<T>):Promise<T>{await fs.mkdir(path.dirname(FILE),{recursive:true});const lock=FILE+".lock";const end=Date.now()+10000;for(;;){try{await fs.mkdir(lock);break}catch(e){if((e as NodeJS.ErrnoException).code!=="EEXIST")throw e;if(Date.now()>end)throw new Error("Local storage is busy. Please try again.");await new Promise(resolve=>setTimeout(resolve,20));}}try{return await fn()}finally{await fs.rmdir(lock)}}
export async function kvGet(key:string):Promise<string|null>{if(mode()==="kv")return await kvCmd(["GET",key]);const all=await fileReadAll(),v=all[key];return typeof v==="string"?v:v==null?null:JSON.stringify(v)}
export async function kvSet(key:string,value:string):Promise<void>{if(mode()==="kv"){await kvCmd(["SET",key,value]);return}await withFileLock(async()=>{const all=await fileReadAll();all[key]=value;await fileWriteAll(all)})}
export async function kvCompareAndSet(key:string,expectedRevision:number|null,value:string):Promise<boolean>{
 if(mode()==="kv"){const script="local current = redis.call('GET', KEYS[1]); if ARGV[1] == '-1' then if current then return 0 end else if not current or cjson.decode(current).revision ~= tonumber(ARGV[1]) then return 0 end end; redis.call('SET', KEYS[1], ARGV[2]); return 1";return Number(await kvCmd(["EVAL",script,1,key,expectedRevision??-1,value]))===1}
 return withFileLock(async()=>{const all=await fileReadAll(),current=all[key];if(expectedRevision===null){if(current!==undefined)return false}else{if(typeof current!=="string"||JSON.parse(current).revision!==expectedRevision)return false}all[key]=value;await fileWriteAll(all);return true});
}
export async function kvLPush(key:string,value:string):Promise<void>{if(mode()==="kv"){await kvCmd(["LPUSH",key,value]);return}await withFileLock(async()=>{const all=await fileReadAll();const arr=Array.isArray(all[key])?all[key] as string[]:[];arr.unshift(value);all[key]=arr;await fileWriteAll(all)})}
export async function kvLTrim(key:string,start:number,stop:number):Promise<void>{if(mode()==="kv"){await kvCmd(["LTRIM",key,start,stop]);return}await withFileLock(async()=>{const all=await fileReadAll();const arr=Array.isArray(all[key])?all[key] as string[]:[];all[key]=arr.slice(start,stop+1);await fileWriteAll(all)})}

