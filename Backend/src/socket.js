import { Server } from "socket.io";
import jwt from 'jsonwebtoken';
import { User } from './models/user.model.js';
import { Message, MESSAGE_MAX_LENGTH } from './models/message.model.js';
import { getAcceptedMentorshipFor } from './utils/chatAccess.js';

// set by initSocket; stays undefined when the app runs without chat, for example in API tests
let io;

const roomFor = (mentorshipId) => `mentorship:${mentorshipId}`;
// every socket of a user joins this room, so all of them can be closed at once
const userRoom = (userId) => `user:${userId}`;

const readCookie = (header, name) => {
    const pair = (header || '').split(';').map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
    return pair ? decodeURIComponent(pair.slice(name.length + 1)) : null;
};

// the same access token cookie the REST API uses
const authenticate = async (socket, next) => {
    try {
        const token = readCookie(socket.handshake.headers.cookie, 'accessToken');
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user = await User.findById(decoded?._id).select('_id tokenVersion');

        if (!user) throw new Error('Unknown user');
        if (decoded.tokenVersion !== user.tokenVersion) throw new Error('Session ended');

        socket.data.userId = user._id;
        next();
    } catch (error) {
        next(new Error('Unauthorized'));
    }
};

// runs a handler and reports the outcome through the client's acknowledgement callback,
// so a bad payload or a refused action never crashes the server
const withAck = (handler) => async (...args) => {
    // the acknowledgement is always the last argument; the payload may be missing
    const ack = args.findLast((arg) => typeof arg === 'function');
    const reply = ack || (() => {});
    const payload = args[0] && typeof args[0] === 'object' ? args[0] : {};

    try {
        reply({ ok: true, ...(await handler(payload)) });
    } catch (error) {
        if (!error.statusCode) console.log(error);
        reply({ ok: false, error: error.statusCode ? error.message : 'Something went wrong' });
    }
};

const chatError = (message) => Object.assign(new Error(message), { statusCode: 400 });

const initSocket = (httpServer) => {
    io = new Server(httpServer, {
        cors: { origin: process.env.CORS_ORIGIN, credentials: true },
    });

    io.use(authenticate);

    io.on('connection', (socket) => {
        const userId = socket.data.userId;

        socket.join(userRoom(userId));

        socket.on('chat:join', withAck(async ({ mentorshipId }) => {
            const mentorship = await getAcceptedMentorshipFor(mentorshipId, userId);
            socket.join(roomFor(mentorship._id));
        }));

        socket.on('chat:send', withAck(async ({ mentorshipId, text }) => {
            // checked on every message: a mentorship can stop being active after the socket joined
            const mentorship = await getAcceptedMentorshipFor(mentorshipId, userId);
            const trimmed = typeof text === 'string' ? text.trim() : '';

            if (!trimmed) {
                throw chatError('Message cannot be empty');
            }

            if (trimmed.length > MESSAGE_MAX_LENGTH) {
                throw chatError('Message must be at most 1000 characters');
            }

            const saved = await Message.create({ mentorship: mentorship._id, sender: userId, text: trimmed });
            const message = {
                _id: String(saved._id),
                mentorship: String(saved.mentorship),
                sender: String(saved.sender),
                text: saved.text,
                createdAt: saved.createdAt,
            };

            io.to(roomFor(mentorship._id)).emit('chat:message', message);
            return { message };
        }));
    });

    return io;
};

// closes every chat connection of a user, for example when they log out
const disconnectUser = (userId) => {
    io?.in(userRoom(userId)).disconnectSockets(true);
};

export { initSocket, disconnectUser }
