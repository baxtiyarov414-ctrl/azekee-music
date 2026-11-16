import { getStore } from "@netlify/blobs";
import bcrypt from "bcryptjs";
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
const STORE="azekee-music-files", cookieName="azekee_admin", maxAge=28800;
const store=()=>getStore({name:STORE,consistency:"strong"});
const secret=()=>process.env.SESSION_SECRET||"";
const sign=x=>createHmac("sha256",secret()).update(x).digest("base64url");
const json=(x,status=200,headers={})=>new Response(JSON.stringify(x),{status,headers:{"content-type":"application/json","cache-control":"no-store",...headers}});
function token(req){let c=req.headers.get("cookie")||"",v=c.split(";").map(x=>x.trim()).find(x=>x.startsWith(cookieName+"="));return v?decodeURIComponent(v.slice(cookieName.length+1)):""}
function owner(req){let [p,s]=token(req).split(".");if(!p||!s||!secret())return false;let expected=sign(p),a=Buffer.from(s),b=Buffer.from(expected);if(a.length!==b.length||!timingSafeEqual(a,b))return false;try{return JSON.parse(Buffer.from(p,"base64url").toString()).exp>Date.now()}catch{return false}}
function setCookie(){let p=Buffer.from(JSON.stringify({exp:Date.now()+maxAge*1000})).toString("base64url");return `${cookieName}=${p}.${sign(p)}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${maxAge}`}
const clearCookie=`${cookieName}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`;
export default async req=>{
 const u=new URL(req.url),p=u.pathname;
 if(p==="/api/admin/status"&&req.method==="GET")return json({isOwner:owner(req)});
 if(p==="/api/admin/login"&&req.method==="POST"){if(!process.env.ADMIN_USERNAME||!process.env.ADMIN_PASSWORD_HASH||!secret())return json({error:"Netlify environment variables sozlanmagan."},500);let d;try{d=await req.json()}catch{return json({error:"Noto‘g‘ri so‘rov."},400)};if(typeof d.username!=="string"||d.username!==process.env.ADMIN_USERNAME)return json({error:"Login yoki parol noto‘g‘ri."},401);if(!await bcrypt.compare(typeof d.password==="string"?d.password:"",process.env.ADMIN_PASSWORD_HASH))return json({error:"Login yoki parol noto‘g‘ri."},401);return json({ok:true},200,{"set-cookie":setCookie()})}
 if(p==="/api/admin/logout"&&req.method==="POST")return json({ok:true},200,{"set-cookie":clearCookie});
 if(p==="/api/songs"&&req.method==="GET"){let x=await store().list();return json(x.blobs.map(b=>({id:b.key,title:b.metadata?.title||"Nomsiz trek",artist:b.metadata?.artist||"Azekee Music",url:"/api/audio?id="+encodeURIComponent(b.key)})))}
 if(p==="/api/audio"&&req.method==="GET"){let id=u.searchParams.get("id")||"";if(!/^[a-f0-9-]{36}$/i.test(id))return json({error:"Audio topilmadi."},404);let s=store(),blob=await s.get(id,{type:"arrayBuffer"});if(!blob)return json({error:"Audio topilmadi."},404);let m=await s.getMetadata(id);return new Response(blob,{headers:{"content-type":m?.metadata?.contentType||"audio/mpeg","cache-control":"public,max-age=3600","x-content-type-options":"nosniff"}})}
 if(p==="/api/admin/upload"&&req.method==="POST"){if(!owner(req))return json({error:"Faqat sayt egasi uchun."},401);let f;try{f=await req.formData()}catch{return json({error:"Fayllar qabul qilinmadi."},400)}let files=f.getAll("tracks").filter(x=>x instanceof File);if(!files.length)return json({error:"Audio tanlang."},400);if(files.length>5)return json({error:"Bir martada 5 tagacha fayl."},400);let s=await store(),added=0;for(let file of files){if(!file.type.startsWith("audio/"))return json({error:"Faqat audio fayl."},400);if(file.size>4*1024*1024)return json({error:"Har bir fayl 4 MB dan kichik bo‘lsin."},413);await s.set(randomUUID(),await file.arrayBuffer(),{metadata:{title:file.name.replace(/\\.[^.]+$/,"").slice(0,120),artist:"Azekee Music",contentType:file.type}});added++}return json({added},201)}
 if(p==="/api/admin/delete"&&req.method==="POST"){if(!owner(req))return json({error:"Faqat sayt egasi uchun."},401);let id=u.searchParams.get("id")||"";if(!/^[a-f0-9-]{36}$/i.test(id))return json({error:"ID noto‘g‘ri."},400);await store().delete(id);return json({ok:true})}
 return json({error:"Endpoint topilmadi."},404)
};
export const config={path:"/api/*"};
