import {test} from 'node:test';
import assert from 'node:assert/strict';
import {MongoMemoryServer} from 'mongodb-memory-server';
import mongoose from 'mongoose';
import {createApp} from './app.js';
test('MERN content, authentication, drafts, validation, conflicts, and contact inbox',async t=>{
 const mongo=await MongoMemoryServer.create();await mongoose.connect(mongo.getUri());
 process.env.ADMIN_EMAIL='test@example.com';process.env.ADMIN_PASSWORD='isolated-test-password-42';
 const app=await createApp();const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
 const base=`http://127.0.0.1:${server.address().port}`;let cookie='';
 const request=(path,method='GET',body,extra={})=>fetch(base+'/api'+path,{method,headers:{'Content-Type':'application/json',Origin:base,...(cookie?{Cookie:cookie}:{}),...extra},...(body?{body:JSON.stringify(body)}:{})});
 try{
 await t.test('public content loads and anonymous writes are blocked',async()=>{const r=await request('/content');assert.equal(r.status,200);assert.equal((await r.json()).profile.name,'Arish Ahmad');assert.equal((await request('/admin/content','PUT',{})).status,401);});
 await t.test('invalid sign-in and foreign-origin writes fail',async()=>{assert.equal((await request('/login','POST',{email:'test@example.com',password:'wrong'})).status,401);assert.equal((await request('/login','POST',{}, {Origin:'https://foreign.example'})).status,403);});
 await t.test('valid sign-in issues an HttpOnly session',async()=>{const r=await request('/login','POST',{email:'test@example.com',password:'isolated-test-password-42'});assert.equal(r.status,200);assert.match(r.headers.get('set-cookie'),/HttpOnly/);cookie=r.headers.get('set-cookie').split(';')[0];});
 await t.test('content is persisted, drafts are private, stale saves conflict',async()=>{const current=await (await request('/admin/content')).json();current.content.posts=[{id:'draft',title:'Draft note',excerpt:'Private',body:'Not public',date:'2026-10-05',published:false},{id:'public',title:'Published note',excerpt:'Public',body:'Visible',date:'2026-10-05',published:true}];const r=await request('/admin/content','PUT',current);assert.equal(r.status,200);assert.equal((await request('/admin/content','PUT',current)).status,409);const pub=await(await request('/content')).json();assert.deepEqual(pub.posts.map(p=>p.id),['public']);assert.equal((await(await request('/admin/content')).json()).content.posts.length,2);});
 await t.test('unsafe links and malformed records are rejected',async()=>{const row=await(await request('/admin/content')).json();row.content.profile.github='javascript:alert(1)';assert.equal((await request('/admin/content','PUT',row)).status,400);});
 await t.test('contact messages persist and validation rejects incomplete messages',async()=>{assert.equal((await request('/messages','POST',{name:'Test',email:'test@example.com',message:'Hello from the integration test.'})).status,201);assert.equal((await request('/messages','POST',{name:'Test',email:'invalid',message:'x'})).status,400);const inbox=await(await request('/admin/messages')).json();assert.equal(inbox.length,1);assert.equal(inbox[0].name,'Test');});
 await t.test('logout revokes session',async()=>{assert.equal((await request('/logout','POST',{})).status,200);assert.equal((await request('/admin/content')).status,401);});
 }finally{await new Promise(r=>server.close(r));await mongoose.disconnect();await mongo.stop();}
});
