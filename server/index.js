import mongoose from 'mongoose';
import {createApp} from './app.js';
if(!process.env.MONGODB_URI){console.error('Set MONGODB_URI in .env before starting the server.');process.exit(1);}
try{await mongoose.connect(process.env.MONGODB_URI,{serverSelectionTimeoutMS:10000});const app=await createApp();const server=app.listen(process.env.PORT||4000,()=>console.log(`Portfolio ready at http://localhost:${process.env.PORT||4000}`));for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close(async()=>{await mongoose.disconnect();process.exit(0);}));}catch(error){console.error('Unable to start portfolio:',error.message);process.exit(1);}
