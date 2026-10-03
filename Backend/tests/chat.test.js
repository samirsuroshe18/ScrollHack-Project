import http from 'http';
import request from 'supertest';
import { io as connectClient } from 'socket.io-client';
import app from '../src/app.js';
import { initSocket } from '../src/socket.js';
import { Mentorship } from '../src/models/mentorship.model.js';
import { Message } from '../src/models/message.model.js';
import { createVerifiedUser } from './helpers.js';

let server;
let io;
let baseUrl;
let clients = [];

beforeAll((done) => {
    server = http.createServer(app);
    io = initSocket(server);
    server.listen(0, () => {
        baseUrl = `http://localhost:${server.address().port}`;
        done();
    });
});

afterEach(() => {
    clients.forEach((client) => client.close());
    clients = [];
});

afterAll((done) => {
    io.close();
    server.close(done);
});

const cookieFor = async (user) => {
    const res = await request(app).post('/api/v1/users/login').send({ email: user.email, password: 'secret12' });
    return res.headers['set-cookie'].map((cookie) => cookie.split(';')[0]).join('; ');
};

// resolves with the connected socket, or rejects with the connection error
const connect = (cookie, auth) => new Promise((resolve, reject) => {
    const client = connectClient(baseUrl, {
        extraHeaders: cookie ? { cookie } : {},
        auth,
        transports: ['websocket'],
        reconnection: false,
    });
    clients.push(client);
    client.on('connect', () => resolve(client));
    client.on('connect_error', reject);
});

const emit = (client, event, payload) =>
    new Promise((resolve) => client.emit(event, payload, resolve));

const nextMessage = (client) =>
    new Promise((resolve) => client.once('chat:message', resolve));

const setup = async (status = 'accepted') => {
    const student = await createVerifiedUser({ userName: 'Student' });
    const mentor = await createVerifiedUser({ role: 'alumni', userName: 'Mentor' });
    const mentorship = await Mentorship.create({ student: student._id, mentor: mentor._id, status });
    return { student, mentor, mentorship, mentorshipId: String(mentorship._id) };
};

test('a socket without a valid cookie is refused', async () => {
    await expect(connect()).rejects.toThrow('Unauthorized');
    await expect(connect('accessToken=not-a-token')).rejects.toThrow('Unauthorized');
});

test('participants of an accepted mentorship can join; a stranger cannot', async () => {
    const { student, mentor, mentorshipId } = await setup();
    const stranger = await createVerifiedUser();

    const studentJoin = await emit(await connect(await cookieFor(student)), 'chat:join', { mentorshipId });
    const mentorJoin = await emit(await connect(await cookieFor(mentor)), 'chat:join', { mentorshipId });
    const strangerJoin = await emit(await connect(await cookieFor(stranger)), 'chat:join', { mentorshipId });

    expect(studentJoin).toEqual({ ok: true });
    expect(mentorJoin).toEqual({ ok: true });
    expect(strangerJoin).toEqual({ ok: false, error: 'You are not part of this mentorship' });
});

test('joining with a malformed or missing id is refused without crashing', async () => {
    const { student } = await setup();
    const client = await connect(await cookieFor(student));

    expect(await emit(client, 'chat:join', { mentorshipId: 'not-an-id' })).toEqual({ ok: false, error: 'Invalid id' });
    expect(await emit(client, 'chat:join', null)).toEqual({ ok: false, error: 'Invalid id' });
    expect(await emit(client, 'chat:send', 'hello')).toEqual({ ok: false, error: 'Invalid id' });
});

test('a sent message is saved and delivered to both participants', async () => {
    const { student, mentor, mentorshipId } = await setup();
    const studentSocket = await connect(await cookieFor(student));
    const mentorSocket = await connect(await cookieFor(mentor));
    await emit(studentSocket, 'chat:join', { mentorshipId });
    await emit(mentorSocket, 'chat:join', { mentorshipId });
    const receivedByMentor = nextMessage(mentorSocket);
    const receivedBySender = nextMessage(studentSocket);

    const ack = await emit(studentSocket, 'chat:send', { mentorshipId, text: '  Hello there  ' });

    expect(ack.ok).toBe(true);
    expect(ack.message.text).toBe('Hello there');
    expect((await receivedByMentor).text).toBe('Hello there');
    expect((await receivedByMentor).sender).toBe(String(student._id));
    expect((await receivedBySender).mentorship).toBe(mentorshipId);
    const saved = await Message.find();
    expect(saved).toHaveLength(1);
    expect(saved[0].text).toBe('Hello there');
});

test('a stranger does not receive messages from a room they could not join', async () => {
    const { student, mentorshipId } = await setup();
    const stranger = await createVerifiedUser();
    const studentSocket = await connect(await cookieFor(student));
    const strangerSocket = await connect(await cookieFor(stranger));
    await emit(studentSocket, 'chat:join', { mentorshipId });
    await emit(strangerSocket, 'chat:join', { mentorshipId });
    let leaked = false;
    strangerSocket.on('chat:message', () => { leaked = true; });

    await emit(studentSocket, 'chat:send', { mentorshipId, text: 'private' });
    await new Promise((resolve) => setTimeout(resolve, 200));

    expect(leaked).toBe(false);
});

test('whitespace-only and over-long messages are refused and not saved', async () => {
    const { student, mentorshipId } = await setup();
    const client = await connect(await cookieFor(student));
    await emit(client, 'chat:join', { mentorshipId });

    const blank = await emit(client, 'chat:send', { mentorshipId, text: '   ' });
    const notText = await emit(client, 'chat:send', { mentorshipId, text: { a: 1 } });
    const tooLong = await emit(client, 'chat:send', { mentorshipId, text: 'a'.repeat(1001) });
    const maxLength = await emit(client, 'chat:send', { mentorshipId, text: 'a'.repeat(1000) });

    expect(blank).toEqual({ ok: false, error: 'Message cannot be empty' });
    expect(notText).toEqual({ ok: false, error: 'Message cannot be empty' });
    expect(tooLong).toEqual({ ok: false, error: 'Message must be at most 1000 characters' });
    expect(maxLength.ok).toBe(true);
    expect(await Message.countDocuments()).toBe(1);
});

test('sending on a pending or declined mentorship is refused and not saved', async () => {
    const pending = await setup('pending');
    const declined = await setup('declined');
    const pendingSocket = await connect(await cookieFor(pending.student));
    const declinedSocket = await connect(await cookieFor(declined.mentor));

    const pendingAck = await emit(pendingSocket, 'chat:send', { mentorshipId: pending.mentorshipId, text: 'hi' });
    const declinedAck = await emit(declinedSocket, 'chat:send', { mentorshipId: declined.mentorshipId, text: 'hi' });

    expect(pendingAck).toEqual({ ok: false, error: 'This mentorship is not active' });
    expect(declinedAck).toEqual({ ok: false, error: 'This mentorship is not active' });
    expect(await Message.countDocuments()).toBe(0);
});

test('sending after the mentorship stops being accepted is refused', async () => {
    const { student, mentorship, mentorshipId } = await setup();
    const client = await connect(await cookieFor(student));
    await emit(client, 'chat:join', { mentorshipId });
    mentorship.status = 'declined';
    await mentorship.save();

    const ack = await emit(client, 'chat:send', { mentorshipId, text: 'still there?' });

    expect(ack).toEqual({ ok: false, error: 'This mentorship is not active' });
    expect(await Message.countDocuments()).toBe(0);
});

test('a non-participant cannot send to an accepted mentorship', async () => {
    const { mentorshipId } = await setup();
    const stranger = await createVerifiedUser();
    const client = await connect(await cookieFor(stranger));

    const ack = await emit(client, 'chat:send', { mentorshipId, text: 'let me in' });

    expect(ack).toEqual({ ok: false, error: 'You are not part of this mentorship' });
    expect(await Message.countDocuments()).toBe(0);
});

test('an event with an acknowledgement but no payload is still answered', async () => {
    const { student, mentorshipId } = await setup();
    const client = await connect(await cookieFor(student));

    const noPayload = await new Promise((resolve) => client.emit('chat:send', resolve));
    const extraArgument = await new Promise((resolve) =>
        client.emit('chat:send', { mentorshipId, text: 'hello' }, 'extra', resolve));

    expect(noPayload).toEqual({ ok: false, error: 'Invalid id' });
    expect(extraArgument.ok).toBe(true);
});

test('logging out closes the open chat connection and the old cookie cannot reconnect', async () => {
    const { student } = await setup();
    const cookie = await cookieFor(student);
    const client = await connect(cookie);
    const disconnected = new Promise((resolve) => client.once('disconnect', resolve));

    await request(app).get('/api/v1/users/logout').set('Cookie', cookie);

    expect(await disconnected).toBe('io server disconnect');
    await expect(connect(cookie)).rejects.toThrow('Unauthorized');
});

describe('chat token', () => {
    const chatTokenFor = async (cookie) => {
        const res = await request(app).get('/api/v1/users/chat-token').set('Cookie', cookie);
        return res.body.data.token;
    };

    test('requires login', async () => {
        const res = await request(app).get('/api/v1/users/chat-token');
        expect(res.status).toBe(401);
    });

    test('connects a socket that has no cookie, as when the web app is on another host', async () => {
        const { student, mentorshipId } = await setup();
        const token = await chatTokenFor(await cookieFor(student));

        const client = await connect(null, { token });
        const join = await emit(client, 'chat:join', { mentorshipId });
        const sent = await emit(client, 'chat:send', { mentorshipId, text: 'hello from another host' });

        expect(join).toEqual({ ok: true });
        expect(sent.ok).toBe(true);
        expect(sent.message.sender).toBe(String(student._id));
    });

    test('cannot be used as a login token for the API', async () => {
        const { student } = await setup();
        const token = await chatTokenFor(await cookieFor(student));

        const asBearer = await request(app).get('/api/v1/users/me').set('Authorization', `Bearer ${token}`);
        const asCookie = await request(app).get('/api/v1/users/me').set('Cookie', `accessToken=${token}`);

        expect(asBearer.status).toBe(401);
        expect(asCookie.status).toBe(401);
    });

    test('a login token is not accepted in place of a chat token', async () => {
        const { student } = await setup();
        const cookie = await cookieFor(student);
        const accessToken = cookie.match(/accessToken=([^;]+)/)[1];

        await expect(connect(null, { token: accessToken })).rejects.toThrow('Unauthorized');
        await expect(connect(null, { token: 'garbage' })).rejects.toThrow('Unauthorized');
        await expect(connect(null, { token: { a: 1 } })).rejects.toThrow('Unauthorized');
    });

    test('stops working once the user logs out', async () => {
        const { student } = await setup();
        const cookie = await cookieFor(student);
        const token = await chatTokenFor(cookie);

        await request(app).get('/api/v1/users/logout').set('Cookie', cookie);

        await expect(connect(null, { token })).rejects.toThrow('Unauthorized');
    });
});
