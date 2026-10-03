import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { Mentorship } from '../src/models/mentorship.model.js';
import { Message } from '../src/models/message.model.js';
import { createVerifiedUser, loginAgent } from './helpers.js';

const url = '/api/v1/mentorships';

// a student, a mentor and their logged-in agents
const pair = async () => {
    const student = await createVerifiedUser({ userName: 'Student' });
    const mentor = await createVerifiedUser({ role: 'alumni', userName: 'Mentor', profile: { profession: 'Engineer' } });
    return {
        student,
        mentor,
        studentAgent: await loginAgent(student),
        mentorAgent: await loginAgent(mentor),
    };
};

const mentorshipWith = async (status) => {
    const people = await pair();
    const mentorship = await Mentorship.create({ student: people.student._id, mentor: people.mentor._id, status });
    return { ...people, mentorship };
};

describe('requesting', () => {
    test('a student can request a mentor and it starts pending', async () => {
        const { studentAgent, student, mentor } = await pair();

        const res = await studentAgent.post(url).send({ mentorId: mentor._id });

        expect(res.status).toBe(201);
        expect(res.body.data.mentorship.status).toBe('pending');
        expect(res.body.data.mentorship.mentor.userName).toBe('Mentor');
        expect(res.body.data.mentorship.student._id).toBe(String(student._id));
    });

    test('an alumnus cannot send a request', async () => {
        const { mentorAgent } = await pair();
        const other = await createVerifiedUser({ role: 'alumni' });

        const res = await mentorAgent.post(url).send({ mentorId: other._id });

        expect(res.status).toBe(403);
        expect(await Mentorship.countDocuments()).toBe(0);
    });

    test('requesting a student, an unverified alumnus or a missing user is 404', async () => {
        const { studentAgent } = await pair();
        const otherStudent = await createVerifiedUser();
        const unverified = await createVerifiedUser({ role: 'alumni', isVerified: false });
        const missing = new mongoose.Types.ObjectId();

        for (const mentorId of [otherStudent._id, unverified._id, missing]) {
            const res = await studentAgent.post(url).send({ mentorId });
            expect(res.status).toBe(404);
            expect(res.body.message).toBe('Mentor not found');
        }
        expect(await Mentorship.countDocuments()).toBe(0);
    });

    test('a second request to the same mentor is 409', async () => {
        const { studentAgent, mentor } = await pair();
        await studentAgent.post(url).send({ mentorId: mentor._id });

        const res = await studentAgent.post(url).send({ mentorId: mentor._id });

        expect(res.status).toBe(409);
        expect(res.body.message).toBe('You have already requested this mentor');
        expect(await Mentorship.countDocuments()).toBe(1);
    });

    test('a malformed or missing mentorId is 400 Invalid id', async () => {
        const { studentAgent } = await pair();

        const malformed = await studentAgent.post(url).send({ mentorId: 'not-an-id' });
        const missing = await studentAgent.post(url).send({});
        const object = await studentAgent.post(url).send({ mentorId: { $ne: null } });

        for (const res of [malformed, missing, object]) {
            expect(res.status).toBe(400);
            expect(res.body.message).toBe('Invalid id');
        }
    });

    test('requesting requires login', async () => {
        const res = await request(app).post(url).send({ mentorId: new mongoose.Types.ObjectId() });
        expect(res.status).toBe(401);
    });
});

describe('listing', () => {
    test('both sides see the mentorship; others do not', async () => {
        const { studentAgent, mentorAgent } = await mentorshipWith('pending');
        const strangerAgent = await loginAgent(await createVerifiedUser());

        const forStudent = await studentAgent.get(url);
        const forMentor = await mentorAgent.get(url);
        const forStranger = await strangerAgent.get(url);

        expect(forStudent.body.data.mentorships).toHaveLength(1);
        expect(forMentor.body.data.mentorships).toHaveLength(1);
        expect(forStranger.body.data.mentorships).toEqual([]);
        expect(forMentor.body.data.mentorships[0].student.userName).toBe('Student');
        expect(forStudent.body.data.mentorships[0].mentor.profile.profession).toBe('Engineer');
        expect(forStudent.body.data.mentorships[0].mentor).not.toHaveProperty('password');
    });
});

describe('responding', () => {
    test('only the mentor can accept; the student and a stranger get 403', async () => {
        const { studentAgent, mentorship } = await mentorshipWith('pending');
        const strangerAgent = await loginAgent(await createVerifiedUser({ role: 'alumni' }));

        const byStudent = await studentAgent.patch(`${url}/${mentorship._id}`).send({ status: 'accepted' });
        const byStranger = await strangerAgent.patch(`${url}/${mentorship._id}`).send({ status: 'accepted' });

        expect(byStudent.status).toBe(403);
        expect(byStranger.status).toBe(403);
        expect(byStranger.body.message).toBe('Only the mentor can respond to this request');
        expect((await Mentorship.findById(mentorship._id)).status).toBe('pending');
    });

    test('accept works once; answering again is 409', async () => {
        const { mentorAgent, mentorship } = await mentorshipWith('pending');

        const first = await mentorAgent.patch(`${url}/${mentorship._id}`).send({ status: 'accepted' });
        const second = await mentorAgent.patch(`${url}/${mentorship._id}`).send({ status: 'declined' });

        expect(first.status).toBe(200);
        expect(first.body.data.mentorship.status).toBe('accepted');
        expect(second.status).toBe(409);
        expect(second.body.message).toBe('This request has already been answered');
        expect((await Mentorship.findById(mentorship._id)).status).toBe('accepted');
    });

    test('decline works', async () => {
        const { mentorAgent, mentorship } = await mentorshipWith('pending');

        const res = await mentorAgent.patch(`${url}/${mentorship._id}`).send({ status: 'declined' });

        expect(res.status).toBe(200);
        expect(res.body.data.mentorship.status).toBe('declined');
    });

    test('an unknown status is 400', async () => {
        const { mentorAgent, mentorship } = await mentorshipWith('pending');

        const res = await mentorAgent.patch(`${url}/${mentorship._id}`).send({ status: 'pending' });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe('Status must be accepted or declined');
    });

    test('a missing mentorship is 404', async () => {
        const { mentorAgent } = await pair();

        const res = await mentorAgent.patch(`${url}/${new mongoose.Types.ObjectId()}`).send({ status: 'accepted' });

        expect(res.status).toBe(404);
        expect(res.body.message).toBe('Mentorship not found');
    });

    test('malformed ids in the URL are 400 Invalid id', async () => {
        const { mentorAgent } = await pair();

        const patch = await mentorAgent.patch(`${url}/not-an-id`).send({ status: 'accepted' });
        const messages = await mentorAgent.get(`${url}/not-an-id/messages`);

        expect(patch.status).toBe(400);
        expect(patch.body.message).toBe('Invalid id');
        expect(messages.status).toBe(400);
        expect(messages.body.message).toBe('Invalid id');
    });
});

describe('message history', () => {
    test('is available to both participants of an accepted mentorship', async () => {
        const { studentAgent, mentorAgent, mentorship } = await mentorshipWith('accepted');

        const forStudent = await studentAgent.get(`${url}/${mentorship._id}/messages`);
        const forMentor = await mentorAgent.get(`${url}/${mentorship._id}/messages`);

        expect(forStudent.status).toBe(200);
        expect(forStudent.body.data.messages).toEqual([]);
        expect(forMentor.status).toBe(200);
    });

    test('is refused for pending and declined mentorships', async () => {
        const pending = await mentorshipWith('pending');
        const declined = await mentorshipWith('declined');

        const pendingRes = await pending.studentAgent.get(`${url}/${pending.mentorship._id}/messages`);
        const declinedRes = await declined.mentorAgent.get(`${url}/${declined.mentorship._id}/messages`);

        expect(pendingRes.status).toBe(403);
        expect(pendingRes.body.message).toBe('This mentorship is not active');
        expect(declinedRes.status).toBe(403);
    });

    test('is refused for a stranger and 404 for a missing mentorship', async () => {
        const { mentorship } = await mentorshipWith('accepted');
        const strangerAgent = await loginAgent(await createVerifiedUser());

        const stranger = await strangerAgent.get(`${url}/${mentorship._id}/messages`);
        const missing = await strangerAgent.get(`${url}/${new mongoose.Types.ObjectId()}/messages`);

        expect(stranger.status).toBe(403);
        expect(stranger.body.message).toBe('You are not part of this mentorship');
        expect(missing.status).toBe(404);
        expect(missing.body.message).toBe('Mentorship not found');
    });

    test('comes back oldest first', async () => {
        const { studentAgent, student, mentor, mentorship } = await mentorshipWith('accepted');
        await Message.create({ mentorship: mentorship._id, sender: mentor._id, text: 'second', createdAt: new Date('2026-02-01') });
        await Message.create({ mentorship: mentorship._id, sender: student._id, text: 'first', createdAt: new Date('2026-01-01') });
        await Message.create({ mentorship: mentorship._id, sender: student._id, text: 'third', createdAt: new Date('2026-03-01') });

        const res = await studentAgent.get(`${url}/${mentorship._id}/messages`);

        expect(res.body.data.messages.map((message) => message.text)).toEqual(['first', 'second', 'third']);
        expect(res.body.data.messages[0].sender).toBe(String(student._id));
    });
});
