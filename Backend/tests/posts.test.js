import request from 'supertest';
import app from '../src/app.js';
import { Post } from '../src/models/post.model.js';
import { createVerifiedUser, loginAgent } from './helpers.js';

const url = '/api/v1/posts';

const alumniAgent = async (overrides = {}) => {
    const user = await createVerifiedUser({ role: 'alumni', ...overrides });
    return { user, agent: await loginAgent(user) };
};

test('an alumnus can post a success story and a job', async () => {
    const { agent, user } = await alumniAgent({ userName: 'Asha' });

    const story = await agent.post(url).send({ type: 'success_story', content: '  I got my first job.  ' });
    const job = await agent.post(url).send({ type: 'job', content: 'Hiring a React developer' });

    expect(story.status).toBe(201);
    expect(story.body.data.post.type).toBe('success_story');
    expect(story.body.data.post.content).toBe('I got my first job.');
    expect(story.body.data.post.author.userName).toBe('Asha');
    expect(job.status).toBe(201);
    expect(job.body.data.post.type).toBe('job');
    expect(await Post.countDocuments({ author: user._id })).toBe(2);
});

test('a student cannot post', async () => {
    const student = await createVerifiedUser();
    const agent = await loginAgent(student);

    const res = await agent.post(url).send({ type: 'job', content: 'Hello' });

    expect(res.status).toBe(403);
    expect(await Post.countDocuments()).toBe(0);
});

test('posting and listing require login', async () => {
    const create = await request(app).post(url).send({ type: 'job', content: 'Hello' });
    const list = await request(app).get(url);

    expect(create.status).toBe(401);
    expect(list.status).toBe(401);
});

test('content must be 1 to 2000 characters after trimming', async () => {
    const { agent } = await alumniAgent();

    const blank = await agent.post(url).send({ type: 'job', content: '   ' });
    const missing = await agent.post(url).send({ type: 'job' });
    const tooLong = await agent.post(url).send({ type: 'job', content: 'a'.repeat(2001) });
    const maxLength = await agent.post(url).send({ type: 'job', content: 'a'.repeat(2000) });

    expect(blank.status).toBe(400);
    expect(blank.body.message).toBe('Content is required');
    expect(missing.status).toBe(400);
    expect(tooLong.status).toBe(400);
    expect(tooLong.body.message).toBe('Content must be at most 2000 characters');
    expect(maxLength.status).toBe(201);
});

test('an unknown type is rejected on create and on list', async () => {
    const { agent } = await alumniAgent();

    const create = await agent.post(url).send({ type: 'rant', content: 'Hello' });
    const list = await agent.get(url).query({ type: 'rant' });

    expect(create.status).toBe(400);
    expect(create.body.message).toBe('Type must be success_story or job');
    expect(list.status).toBe(400);
    expect(list.body.message).toBe('Type must be success_story or job');
});

test('list returns newest first with the author and can filter by type', async () => {
    const { agent, user } = await alumniAgent({ userName: 'Asha', profile: { profession: 'Engineer', workplace: 'Acme' } });
    await Post.create({ author: user._id, type: 'job', content: 'old job', createdAt: new Date('2026-01-01') });
    await Post.create({ author: user._id, type: 'success_story', content: 'story', createdAt: new Date('2026-02-01') });
    await Post.create({ author: user._id, type: 'job', content: 'new job', createdAt: new Date('2026-03-01') });
    const student = await loginAgent(await createVerifiedUser());

    const all = await student.get(url);
    const jobs = await agent.get(url).query({ type: 'job' });

    expect(all.status).toBe(200);
    expect(all.body.data.posts.map((post) => post.content)).toEqual(['new job', 'story', 'old job']);
    expect(all.body.data.posts[0].author.userName).toBe('Asha');
    expect(all.body.data.posts[0].author.profile.profession).toBe('Engineer');
    expect(all.body.data.posts[0].author.profile.workplace).toBe('Acme');
    expect(all.body.data.posts[0].author).not.toHaveProperty('email');
    expect(jobs.body.data.posts.map((post) => post.content)).toEqual(['new job', 'old job']);
});
