import request from 'supertest';
import app from '../src/app.js';
import { User } from '../src/models/user.model.js';
import { createVerifiedUser, loginAgent } from './helpers.js';

const api = '/api/v1';
const validSignup = { userName: 'Asha', email: 'Asha@Example.com', password: 'secret12', role: 'alumni' };

const register = (body) => request(app).post(`${api}/users/register`).send(body);
const login = (body) => request(app).post(`${api}/users/login`).send(body);

describe('register', () => {
    test('creates an unverified account and stores a verify token', async () => {
        const res = await register(validSignup);

        expect(res.status).toBe(201);
        expect(res.body.message).toBe('Verification email sent. Please verify within 10 minutes.');
        const user = await User.findOne({ email: 'asha@example.com' });
        expect(user.isVerified).toBe(false);
        expect(user.role).toBe('alumni');
        expect(user.verifyToken).toMatch(/^[a-f0-9]{64}$/);
    });

    test('stores profile fields sent at sign-up', async () => {
        await register({ ...validSignup, state: 'Maharashtra', district: 'Pune', profile: { profession: 'Engineer', passingYear: 2019 } });

        const user = await User.findOne({ email: 'asha@example.com' });
        expect(user.state).toBe('Maharashtra');
        expect(user.district).toBe('Pune');
        expect(user.profile.profession).toBe('Engineer');
        expect(user.profile.passingYear).toBe(2019);
    });

    test('rejects a missing role', async () => {
        const res = await register({ ...validSignup, role: undefined });
        expect(res.status).toBe(400);
        expect(res.body.message).toBe('Name, email, password and role are required');
    });

    test('rejects an unknown role', async () => {
        const res = await register({ ...validSignup, role: 'admin' });
        expect(res.status).toBe(400);
        expect(res.body.message).toBe('Role must be student or alumni');
    });

    test('rejects a short password', async () => {
        const res = await register({ ...validSignup, password: '12345' });
        expect(res.status).toBe(400);
        expect(res.body.message).toBe('Password must be at least 6 characters');
    });

    test('rejects a malformed email', async () => {
        const res = await register({ ...validSignup, email: 'not-an-email' });
        expect(res.status).toBe(400);
        expect(res.body.message).toBe('Enter a valid email address');
    });

    test('rejects a duplicate email regardless of case', async () => {
        await register(validSignup);
        const res = await register({ ...validSignup, email: 'ASHA@example.com' });
        expect(res.status).toBe(409);
        expect(res.body.message).toBe('An account with this email already exists');
    });
});

describe('email verification', () => {
    test('login is refused before verification and issues a new token', async () => {
        await register(validSignup);
        const before = (await User.findOne({ email: 'asha@example.com' })).verifyToken;

        const res = await login({ email: 'asha@example.com', password: 'secret12' });

        expect(res.status).toBe(403);
        expect(res.body.message).toBe('Email not verified. A new verification link has been sent.');
        const after = (await User.findOne({ email: 'asha@example.com' })).verifyToken;
        expect(after).toMatch(/^[a-f0-9]{64}$/);
        expect(after).not.toBe(before);
    });

    test('the link marks the account verified and cannot be reused', async () => {
        await register(validSignup);
        const { verifyToken } = await User.findOne({ email: 'asha@example.com' });

        const first = await request(app).get(`${api}/verify/verify-email`).query({ token: verifyToken });
        const second = await request(app).get(`${api}/verify/verify-email`).query({ token: verifyToken });

        expect(first.status).toBe(200);
        expect(first.body.message).toBe('Email verified');
        expect((await User.findOne({ email: 'asha@example.com' })).isVerified).toBe(true);
        expect(second.status).toBe(400);
        expect(second.body.message).toBe('Invalid or expired link');
    });

    test('an expired token is rejected', async () => {
        await register(validSignup);
        const user = await User.findOne({ email: 'asha@example.com' });
        user.verifyTokenExpiry = Date.now() - 1000;
        await user.save();

        const res = await request(app).get(`${api}/verify/verify-email`).query({ token: user.verifyToken });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe('Invalid or expired link');
        expect((await User.findOne({ email: 'asha@example.com' })).isVerified).toBe(false);
    });

    test('a missing token is rejected', async () => {
        const res = await request(app).get(`${api}/verify/verify-email`);
        expect(res.status).toBe(400);
        expect(res.body.message).toBe('Invalid or expired link');
    });
});

describe('login', () => {
    test('succeeds regardless of email case and surrounding spaces', async () => {
        await register(validSignup);
        const { verifyToken } = await User.findOne({ email: 'asha@example.com' });
        await request(app).get(`${api}/verify/verify-email`).query({ token: verifyToken });

        const res = await login({ email: ' asha@example.com ', password: 'secret12' });

        expect(res.status).toBe(200);
        expect(res.body.data.user.email).toBe('asha@example.com');
        const cookies = res.headers['set-cookie'].join(';');
        expect(cookies).toContain('accessToken=');
        expect(cookies).toContain('refreshToken=');
    });

    test('a wrong password and an unknown email give the same 401', async () => {
        const user = await createVerifiedUser();

        const wrongPassword = await login({ email: user.email, password: 'wrong-password' });
        const unknownEmail = await login({ email: 'nobody@test.dev', password: 'secret12' });

        expect(wrongPassword.status).toBe(401);
        expect(unknownEmail.status).toBe(401);
        expect(wrongPassword.body.message).toBe('Invalid email or password');
        expect(unknownEmail.body.message).toBe('Invalid email or password');
    });

    test('requires both fields', async () => {
        const res = await login({ email: 'asha@example.com' });
        expect(res.status).toBe(400);
        expect(res.body.message).toBe('Email and password are required');
    });
});

describe('current user', () => {
    test('me returns the user without secret fields', async () => {
        const user = await createVerifiedUser({ role: 'alumni' });
        const agent = await loginAgent(user);

        const res = await agent.get(`${api}/users/me`);

        expect(res.status).toBe(200);
        expect(res.body.data.user.email).toBe(user.email);
        expect(res.body.data.user.role).toBe('alumni');
        expect(res.body.data.user).not.toHaveProperty('password');
        expect(res.body.data.user).not.toHaveProperty('refreshToken');
        expect(res.body.data.user).not.toHaveProperty('verifyToken');
    });

    test('me without a cookie is 401', async () => {
        const res = await request(app).get(`${api}/users/me`);
        expect(res.status).toBe(401);
    });

    test('login does not leak secret fields either', async () => {
        const user = await createVerifiedUser();
        const res = await login({ email: user.email, password: 'secret12' });
        expect(res.body.data.user).not.toHaveProperty('password');
        expect(res.body.data.user).not.toHaveProperty('refreshToken');
    });

    test('PATCH me updates profile fields and parses skills', async () => {
        const user = await createVerifiedUser();
        const agent = await loginAgent(user);

        const res = await agent.patch(`${api}/users/me`).send({
            userName: 'Arjun Rao',
            phoneNo: '9999999999',
            profile: { skills: ' React, Node ,,', passingYear: 2019, location: 'Pune', bio: 'Hello' },
        });

        expect(res.status).toBe(200);
        expect(res.body.data.user.userName).toBe('Arjun Rao');
        expect(res.body.data.user.profile.skills).toEqual(['React', 'Node']);
        expect(res.body.data.user.profile.passingYear).toBe(2019);
        expect(res.body.data.user.profile.location).toBe('Pune');
    });

    test('PATCH me keeps profile fields that were not sent', async () => {
        const user = await createVerifiedUser({ profile: { profession: 'Engineer', location: 'Pune' } });
        const agent = await loginAgent(user);

        const res = await agent.patch(`${api}/users/me`).send({ profile: { location: 'Mumbai' } });

        expect(res.body.data.user.profile.profession).toBe('Engineer');
        expect(res.body.data.user.profile.location).toBe('Mumbai');
    });

    test('PATCH me ignores role, email, password and verification changes', async () => {
        const user = await createVerifiedUser();
        const agent = await loginAgent(user);

        await agent.patch(`${api}/users/me`).send({ role: 'alumni', email: 'x@y.zz', password: 'hacked12', isVerified: false });

        const fresh = await User.findById(user._id);
        expect(fresh.role).toBe('student');
        expect(fresh.email).toBe(user.email);
        expect(fresh.isVerified).toBe(true);
        expect(await fresh.isPasswordCorrect('secret12')).toBe(true);
    });

    test('PATCH me rejects an invalid passing year', async () => {
        const user = await createVerifiedUser();
        const agent = await loginAgent(user);

        const res = await agent.patch(`${api}/users/me`).send({ profile: { passingYear: 'abc' } });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe('Passing year must be a year between 1950 and 2100');
    });

    test('logout clears the session', async () => {
        const user = await createVerifiedUser();
        const agent = await loginAgent(user);

        const out = await agent.get(`${api}/users/logout`);
        const me = await agent.get(`${api}/users/me`);

        expect(out.status).toBe(200);
        expect(out.body.message).toBe('Logged out');
        expect(me.status).toBe(401);
    });
});

describe('password reset', () => {
    const forgot = (email) => request(app).post(`${api}/users/forgot-password`).send({ email });

    test('forgot-password always answers 200 and sets a token only for real accounts', async () => {
        const user = await createVerifiedUser();

        const known = await forgot(user.email);
        const unknown = await forgot('nobody@test.dev');

        expect(known.status).toBe(200);
        expect(unknown.status).toBe(200);
        expect(known.body.message).toBe('If that email is registered, a reset link has been sent.');
        expect(unknown.body.message).toBe(known.body.message);
        expect((await User.findById(user._id)).forgotPasswordToken).toMatch(/^[a-f0-9]{64}$/);
        expect(await User.countDocuments()).toBe(1);
    });

    test('forgot-password requires an email', async () => {
        const res = await forgot('');
        expect(res.status).toBe(400);
        expect(res.body.message).toBe('Email is required');
    });

    test('a valid link sets a new password once', async () => {
        const user = await createVerifiedUser();
        await forgot(user.email);
        const token = (await User.findById(user._id)).forgotPasswordToken;

        const check = await request(app).get(`${api}/verify/reset-password`).query({ token });
        const mismatch = await request(app).post(`${api}/verify/verify-password`).query({ token })
            .send({ password: 'newsecret1', confirmPassword: 'different1' });
        const tooShort = await request(app).post(`${api}/verify/verify-password`).query({ token })
            .send({ password: '123', confirmPassword: '123' });
        const done = await request(app).post(`${api}/verify/verify-password`).query({ token })
            .send({ password: 'newsecret1', confirmPassword: 'newsecret1' });
        const reuse = await request(app).post(`${api}/verify/verify-password`).query({ token })
            .send({ password: 'another123', confirmPassword: 'another123' });

        expect(check.status).toBe(200);
        expect(check.body.message).toBe('Link is valid');
        expect(mismatch.status).toBe(400);
        expect(mismatch.body.message).toBe('Passwords do not match');
        expect(tooShort.status).toBe(400);
        expect(tooShort.body.message).toBe('Password must be at least 6 characters');
        expect(done.status).toBe(200);
        expect(done.body.message).toBe('Password updated');
        expect(reuse.status).toBe(400);
        expect(reuse.body.message).toBe('Invalid or expired link');

        expect((await login({ email: user.email, password: 'newsecret1' })).status).toBe(200);
        expect((await login({ email: user.email, password: 'secret12' })).status).toBe(401);
    });

    test('an unknown reset token is rejected', async () => {
        const res = await request(app).get(`${api}/verify/reset-password`).query({ token: 'nope' });
        expect(res.status).toBe(400);
        expect(res.body.message).toBe('Invalid or expired link');
    });
});
