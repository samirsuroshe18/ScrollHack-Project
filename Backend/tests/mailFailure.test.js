import { jest } from '@jest/globals';
import request from 'supertest';

// every email fails to send in this file
jest.unstable_mockModule('../src/utils/mailSender.js', () => ({
    default: jest.fn(async () => undefined),
}));

const { default: app } = await import('../src/app.js');
const { User } = await import('../src/models/user.model.js');

const api = '/api/v1';

test('sign-up tells the user how to get a new link when the email cannot be sent', async () => {
    const res = await request(app).post(`${api}/users/register`)
        .send({ userName: 'Asha', email: 'asha@example.com', password: 'secret12', role: 'alumni' });

    expect(res.status).toBe(500);
    expect(res.body.message).toBe('Account created, but the verification email could not be sent. Log in to get a new link.');
    expect(await User.countDocuments({ email: 'asha@example.com' })).toBe(1);
});

test('an unverified login does not claim a link was sent when sending failed', async () => {
    await User.create({ userName: 'Asha', email: 'asha@example.com', password: 'secret12', role: 'alumni' });

    const res = await request(app).post(`${api}/users/login`).send({ email: 'asha@example.com', password: 'secret12' });

    expect(res.status).toBe(500);
    expect(res.body.message).toBe('Email not verified, and a new verification link could not be sent. Please try again later.');
});
