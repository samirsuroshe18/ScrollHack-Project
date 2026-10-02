import request from 'supertest';
import app from '../src/app.js';

test('health endpoint responds', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ status: 'ok' });
});

test('unknown route returns a JSON 404', async () => {
    const res = await request(app).get('/api/v1/nope');
    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Route not found');
});
