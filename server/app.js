import express from 'express';
import mongoose from 'mongoose';
import helmet from 'helmet';
import {rateLimit} from 'express-rate-limit';
import {randomBytes,createHash,scryptSync,timingSafeEqual} from 'node:crypto';
import {readFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {contentSchema,messageSchema} from './schema.js';
import {MongoRateLimitStore} from './rate-limit-store.js';
const root=fileURLToPath(new URL('../',import.meta.url));
const model=(name,schema)=>mongoose.models[name]||mongoose.model(name,new mongoose.Schema(schema));
const Content=model('Content',{key:{type:String,unique:true},data:mongoose.Schema.Types.Mixed,revision:{type:Number,default:0}});
const Session=model('Session',{hash:{type:String,unique:true},expiresAt:{type:Date,index:{expires:0}}});
const Message=model('Message',{name:String,email:String,message:String,createdAt:{type:Date,default:Date.now}});
const hash=s=>createHash('sha256').update(s).digest('hex');
export async function createApp({trustProxy=false,serveStatic=true}={}){
 await Promise.all([Content.init(),Session.init(),MongoRateLimitStore.prepare()]);
 const seed=contentSchema.parse(JSON.parse(readFileSync(resolve(root,'src/content.json'),'utf8')));
 await Content.updateOne({key:'portfolio'},{$setOnInsert:{data:seed,revision:0}},{upsert:true});
 const app=express(); app.disable('x-powered-by');
 // Vercel overwrites forwarding headers; trust only the immediate platform proxy.
 if(trustProxy)app.set('trust proxy',1);
 app.use(helmet({contentSecurityPolicy:{directives:{'img-src':["'self'",'data:'],'style-src':["'self'","'unsafe-inline'",'https://fonts.googleapis.com'],'font-src':["'self'",'https://fonts.gstatic.com'],'connect-src':["'self'"]}}}));
 app.use(express.json({limit:'300kb'}));
 app.use('/api',(req,res,next)=>{res.set('Cache-Control','no-store');if(!['GET','HEAD','OPTIONS'].includes(req.method)){const origin=req.get('origin');const host=req.get('host');const allowed=process.env.APP_ORIGIN; if(!origin || !(origin===allowed || origin===`${req.protocol}://${host}`))return res.status(403).json({error:'Request origin is not allowed.'});if(!req.is('application/json'))return res.status(415).json({error:'JSON is required.'});}next();});
 const salt=randomBytes(32); const password=process.env.ADMIN_PASSWORD||'';const passwordKey=password?scryptSync(password,salt,64):null;
 const configured=Boolean(process.env.ADMIN_EMAIL&&password.length>=12);
 const token=req=>{const match=(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('portfolio_session='));return match?.slice('portfolio_session='.length)||'';};
 const auth=async(req,res,next)=>{const t=token(req);if(!/^[a-f0-9]{64}$/.test(t))return res.status(401).json({error:'Please sign in.'});const session=await Session.findOne({hash:hash(t),expiresAt:{$gt:new Date()}});if(!session)return res.status(401).json({error:'Your session has expired. Please sign in again.'});next();};
 const cookieOptions={httpOnly:true,sameSite:'strict',secure:process.env.NODE_ENV==='production',path:'/api',maxAge:8*60*60*1000};
 app.get('/api/health',async(req,res)=>{await mongoose.connection.db.admin().ping();res.json({ok:true});});
 app.get('/api/content',async(req,res)=>{const row=await Content.findOne({key:'portfolio'});res.json({...row.data,posts:row.data.posts.filter(p=>p.published)});});
 app.post('/api/login',rateLimit({store:new MongoRateLimitStore('login'),windowMs:15*60*1000,limit:10,standardHeaders:'draft-8',legacyHeaders:false,message:{error:'Too many sign-in attempts. Try again in 15 minutes.'}}),async(req,res)=>{
  if(!configured)return res.status(503).json({error:'Set ADMIN_EMAIL and a password of at least 12 characters on the server to enable sign-in.'});
  const {email,password:provided}=req.body||{};
  if(typeof provided!=='string'||provided.length>1024||typeof email!=='string')return res.status(400).json({error:'Enter your email and password.'});
  const valid=timingSafeEqual(scryptSync(provided,salt,64),passwordKey);
  if(email.toLowerCase()!==process.env.ADMIN_EMAIL.toLowerCase()||!valid)return res.status(401).json({error:'Incorrect email or password.'});
  const t=randomBytes(32).toString('hex');await Session.create({hash:hash(t),expiresAt:new Date(Date.now()+cookieOptions.maxAge)});res.cookie('portfolio_session',t,cookieOptions).json({ok:true});
 });
 app.post('/api/logout',async(req,res)=>{await Session.deleteOne({hash:hash(token(req))});res.clearCookie('portfolio_session',{path:'/api',httpOnly:true,sameSite:'strict',secure:cookieOptions.secure}).json({ok:true});});
 app.get('/api/admin/content',auth,async(req,res)=>{const row=await Content.findOne({key:'portfolio'});res.json({content:row.data,revision:row.revision});});
 app.put('/api/admin/content',auth,async(req,res)=>{const parsed=contentSchema.safeParse(req.body.content);if(!parsed.success)return res.status(400).json({error:parsed.error.issues.map(i=>`${i.path.join('.')}: ${i.message}`).join('\n')});if(!Number.isInteger(req.body.revision))return res.status(400).json({error:'Missing revision.'});const row=await Content.findOneAndUpdate({key:'portfolio',revision:req.body.revision},{$set:{data:parsed.data},$inc:{revision:1}},{new:true});if(!row)return res.status(409).json({error:'Content changed in another session. Reload before saving.'});res.json({ok:true,revision:row.revision});});
 app.post('/api/messages',rateLimit({store:new MongoRateLimitStore('messages'),windowMs:60*60*1000,limit:5,standardHeaders:'draft-8',legacyHeaders:false,message:{error:'Message limit reached. Please use the email link instead.'}}),async(req,res)=>{const p=messageSchema.safeParse(req.body);if(!p.success)return res.status(400).json({error:'Please provide your name, a valid email, and a message of 10–5000 characters.'});if(p.data.website)return res.status(400).json({error:'Unable to submit this message.'});await Message.create({name:p.data.name,email:p.data.email,message:p.data.message});res.status(201).json({ok:true});});
 app.get('/api/admin/messages',auth,async(req,res)=>res.json(await Message.find().sort({createdAt:-1}).limit(200).lean()));
 app.use('/api',(req,res)=>res.status(404).json({error:'API endpoint not found.'}));
 const dist=resolve(root,'dist');if(serveStatic&&existsSync(dist)){app.use(express.static(dist));app.get('/{*path}',(req,res)=>res.sendFile(resolve(dist,'index.html')));}
 app.use((err,req,res,next)=>{console.error(err.message);res.status(err.status===400?400:500).json({error:err.status===400?'Invalid request.':'Something went wrong. Please try again.'});});
 return app;
}
