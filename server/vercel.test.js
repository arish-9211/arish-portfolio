import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {MongoMemoryServer} from 'mongodb-memory-server';
import mongoose from 'mongoose';
import handler from '../api/index.js';
import {MongoRateLimitStore} from './rate-limit-store.js';

test('Vercel handler, HTTPS sessions, and shared rate limits', async t => {
  const mongo = await MongoMemoryServer.create();
  process.env.VERCEL = '1';
  process.env.NODE_ENV = 'production';
  process.env.ADMIN_EMAIL = 'test@example.com';
  process.env.ADMIN_PASSWORD = 'isolated-vercel-test-password';
  delete process.env.APP_ORIGIN;
  delete process.env.MONGODB_URI;

  const server = createServer(handler).listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  let cookie;
  let secondServer;
  const request = (path, {method = 'GET', body, ip = '203.0.113.10', target = base, origin = target.replace('http:', 'https:')} = {}) => fetch(target + '/api' + path, {
    method,
    headers: {
      Origin: origin,
      'X-Forwarded-Proto': 'https', 'X-Forwarded-For': ip,
      'Content-Type': 'application/json', ...(cookie ? {Cookie: cookie} : {}),
    },
    ...(body ? {body: JSON.stringify(body)} : {}),
  });

  try {
    await t.test('missing configuration fails safely and can recover', async () => {
      const result = await request('/health');
      assert.equal(result.status, 503);
      assert.equal(result.headers.get('cache-control'), 'no-store');
      assert.doesNotMatch(await result.text(), /MONGODB_URI|mongodb:\/\//);
      process.env.MONGODB_URI = mongo.getUri();
    });

    await t.test('concurrent cold-start requests seed once and reach the API', async () => {
      const results = await Promise.all(Array.from({length: 5}, () => request('/content')));
      for (const result of results) {
        assert.equal(result.status, 200);
        assert.equal((await result.json()).profile.name, 'Arish Ahmad');
      }
      assert.equal(await mongoose.models.Content.countDocuments({key: 'portfolio'}), 1);
      assert.deepEqual(await (await request('/health')).json(), {ok: true});
      const unknown = await request('/unknown');
      assert.equal(unknown.status, 404);
      assert.match(unknown.headers.get('content-type'), /application\/json/);
    });

    await t.test('HTTPS forwarded requests sign in with secure cookies', async () => {
      const result = await request('/login', {method: 'POST', body: {email: 'test@example.com', password: process.env.ADMIN_PASSWORD}});
      assert.equal(result.status, 200);
      const header = result.headers.get('set-cookie');
      for (const flag of [/HttpOnly/, /Secure/, /SameSite=Strict/, /Path=\/api/]) assert.match(header, flag);
      cookie = header.split(';')[0];
      assert.equal((await request('/admin/content')).status, 200);
      assert.equal((await request('/messages', {method: 'POST', body: {}, origin: 'https://foreign.example'})).status, 403);
    });

    await t.test('contact messages persist across fresh handler instances', async () => {
      assert.equal((await request('/messages', {method: 'POST', body: {name: 'Deployment test', email: 'test@example.com', message: 'Isolated deployment verification message.'}})).status, 201);
      const {default: secondHandler} = await import('../api/index.js?second-instance');
      secondServer = createServer(secondHandler).listen(0, '127.0.0.1');
      await new Promise(resolve => secondServer.once('listening', resolve));
      const target = `http://127.0.0.1:${secondServer.address().port}`;
      const inbox = await request('/admin/messages', {target});
      assert.equal(inbox.status, 200);
      assert.equal((await inbox.json())[0].name, 'Deployment test');
    });

    await t.test('login limits are shared while distinct client IPs stay independent', async () => {
      const target = `http://127.0.0.1:${secondServer.address().port}`;
      const body = {email: 'test@example.com', password: 'wrong'};
      for (let i = 0; i < 10; i++) {
        const result = await request('/login', {method: 'POST', body, ip: '203.0.113.20', target: i % 2 ? target : base});
        assert.equal(result.status, 401);
      }
      assert.equal((await request('/login', {method: 'POST', body, ip: '203.0.113.20'})).status, 429);
      assert.equal((await request('/login', {method: 'POST', body, ip: '203.0.113.21', target})).status, 401);
    });

    await t.test('concurrent counters cannot lose requests', async () => {
      const first = new MongoRateLimitStore('concurrency-test');
      const second = new MongoRateLimitStore('concurrency-test');
      first.init({windowMs: 3600000});
      second.init({windowMs: 3600000});
      const rows = await Promise.all(Array.from({length: 20}, (_, i) => (i % 2 ? first : second).increment('example-client')));
      assert.deepEqual(rows.map(row => row.totalHits).sort((a, b) => a - b), Array.from({length: 20}, (_, i) => i + 1));
    });

    await t.test('logout invalidates the shared session', async () => {
      assert.equal((await request('/logout', {method: 'POST', body: {}})).status, 200);
      const target = `http://127.0.0.1:${secondServer.address().port}`;
      assert.equal((await request('/admin/content', {target})).status, 401);
    });
  } finally {
    await new Promise(resolve => server.close(resolve));
    if (secondServer) await new Promise(resolve => secondServer.close(resolve));
    await mongoose.disconnect();
    await mongo.stop();
  }
});
