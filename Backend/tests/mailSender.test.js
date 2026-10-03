import { jest } from '@jest/globals';
import mailSender from '../src/utils/mailSender.js';
import { User } from '../src/models/user.model.js';
import { createVerifiedUser } from './helpers.js';

const realFetch = global.fetch;

beforeEach(() => {
    process.env.BREVO_API_KEY = 'test-brevo-key';
    process.env.MAIL_FROM = 'hello@alumninest.test';
});

afterEach(() => {
    delete process.env.BREVO_API_KEY;
    delete process.env.MAIL_FROM;
    global.fetch = realFetch;
});

const brevoAnswers = (response) => {
    global.fetch = jest.fn(async () => response);
    return global.fetch;
};

test('with an API key, the verification email goes through the Brevo HTTP API', async () => {
    const fetchMock = brevoAnswers({ ok: true, status: 201, json: async () => ({ messageId: '<1@brevo>' }) });
    const user = await createVerifiedUser({ isVerified: false, email: 'asha@example.com' });

    const result = await mailSender(user.email, user._id, 'VERIFY');

    expect(result).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, request] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.brevo.com/v3/smtp/email');
    expect(request.method).toBe('POST');
    expect(request.headers['api-key']).toBe('test-brevo-key');
    const body = JSON.parse(request.body);
    expect(body.sender).toEqual({ name: 'AlumniNest', email: 'hello@alumninest.test' });
    expect(body.to).toEqual([{ email: 'asha@example.com' }]);
    expect(body.subject).toBe('Verify your email');
    const { verifyToken } = await User.findById(user._id);
    expect(body.htmlContent).toContain(`http://localhost:5174/verify-email?token=${verifyToken}`);
});

test('the reset email carries the reset link', async () => {
    const fetchMock = brevoAnswers({ ok: true, status: 201, json: async () => ({ messageId: '<2@brevo>' }) });
    const user = await createVerifiedUser();

    await mailSender(user.email, user._id, 'RESET');

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    const { forgotPasswordToken } = await User.findById(user._id);
    expect(body.subject).toBe('Reset your password');
    expect(body.htmlContent).toContain(`http://localhost:5174/reset-password?token=${forgotPasswordToken}`);
});

test('the sender falls back to MAIL_USER when MAIL_FROM is not set', async () => {
    delete process.env.MAIL_FROM;
    process.env.MAIL_USER = 'owner@alumninest.test';
    const fetchMock = brevoAnswers({ ok: true, status: 201, json: async () => ({}) });
    const user = await createVerifiedUser();

    await mailSender(user.email, user._id, 'VERIFY');

    delete process.env.MAIL_USER;
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).sender.email).toBe('owner@alumninest.test');
});

test('a refusal from the mail service is reported as a failure, not thrown', async () => {
    brevoAnswers({ ok: false, status: 401, text: async () => '{"message":"Key not found"}' });
    const silenced = jest.spyOn(console, 'log').mockImplementation(() => {});
    const user = await createVerifiedUser();

    const result = await mailSender(user.email, user._id, 'VERIFY');

    silenced.mockRestore();
    expect(result).toBeUndefined();
});

test('a network failure is reported as a failure, not thrown', async () => {
    global.fetch = jest.fn(async () => { throw new Error('The operation was aborted due to timeout'); });
    const silenced = jest.spyOn(console, 'log').mockImplementation(() => {});
    const user = await createVerifiedUser();

    const result = await mailSender(user.email, user._id, 'VERIFY');

    silenced.mockRestore();
    expect(result).toBeUndefined();
});

test('without an API key nothing is sent over HTTP', async () => {
    delete process.env.BREVO_API_KEY;
    const fetchMock = brevoAnswers({ ok: true, status: 201, json: async () => ({}) });
    const user = await createVerifiedUser();

    const result = await mailSender(user.email, user._id, 'VERIFY');

    expect(result).toBeTruthy();
    expect(fetchMock).not.toHaveBeenCalled();
});
