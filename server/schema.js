import {z} from 'zod';
const text=z.string().trim().max(5000);
const short=z.string().trim().min(1).max(200);
const link=z.union([z.literal(''),z.url().refine(v=>/^https?:\/\//.test(v),'Use an http or https URL')]);
const id=z.string().regex(/^[a-z0-9][a-z0-9-]{0,79}$/);
export const contentSchema=z.object({
 profile:z.object({name:short,role:short,eyebrow:short,headline:short,intro:text,about:text,email:z.email(),location:short,github:link,linkedin:link,education:short,university:short,graduation:short,cgpa:short}),
 projects:z.array(z.object({id,title:short,category:short,summary:text,description:text,contributions:z.array(short).max(20),tags:z.array(short).max(20),github:link,live:link,featured:z.boolean()})).max(50),
 skills:z.array(z.object({title:short,items:z.array(short).max(30)})).max(12),
 experience:z.array(z.object({title:short,role:short,description:text})).max(30),
 certifications:z.array(short).max(30),
 coding:z.array(z.object({label:short,url:link})).max(15),
 posts:z.array(z.object({id,title:short,excerpt:text,body:z.string().trim().max(40000),date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v=>!Number.isNaN(Date.parse(v))),published:z.boolean()})).max(100)
}).superRefine((v,ctx)=>{for(const k of ['projects','posts'])if(new Set(v[k].map(x=>x.id)).size!==v[k].length)ctx.addIssue({code:'custom',path:[k],message:'Each entry needs a unique ID'});});
export const messageSchema=z.object({name:short,email:z.email().max(254),message:z.string().trim().min(10).max(5000),website:z.string().max(200).optional()});
