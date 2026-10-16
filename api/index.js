import mongoose from 'mongoose';
import {createApp} from '../server/app.js';

let appPromise;

async function getApp() {
  if (!appPromise) {
    appPromise = (async () => {
      if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not configured');
      await mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 10000,
        maxPoolSize: 5,
        maxIdleTimeMS: 60000,
      });
      return createApp({trustProxy: process.env.VERCEL === '1', serveStatic: false});
    })().catch(error => {
      appPromise = undefined;
      throw error;
    });
  }
  return appPromise;
}

export default async function handler(req, res) {
  try {
    const app = await getApp();
    return app(req, res);
  } catch (error) {
    // Connection strings and credentials must never appear in responses or logs.
    console.error('Portfolio API initialization failed:', error.name);
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 503;
    res.end(JSON.stringify({error: 'The service is temporarily unavailable. Please try again.'}));
  }
}
