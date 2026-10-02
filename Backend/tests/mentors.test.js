import request from 'supertest';
import app from '../src/app.js';
import { tokenize, rankMentors } from '../src/utils/mentorSearch.js';
import { createVerifiedUser, loginAgent } from './helpers.js';

const url = '/api/v1/mentors';

describe('tokenize', () => {
    test('lowercases, splits, drops short words and stop words, de-duplicates', () => {
        expect(tokenize('I need a mentor for React, react and Node.js in Pune'))
            .toEqual(['react', 'node', 'pune']);
    });

    test('keeps terms with + or # when they are three or more characters', () => {
        expect(tokenize('C++ and C# dev')).toEqual(['c++', 'dev']);
    });

    test('returns an empty list for empty, missing or stop-word-only text', () => {
        expect(tokenize('')).toEqual([]);
        expect(tokenize(undefined)).toEqual([]);
        expect(tokenize('I need a mentor who can help')).toEqual([]);
    });
});

describe('rankMentors', () => {
    const mentor = (userName, profile) => ({ userName, profile });
    const a = mentor('Asha', { skills: ['React', 'Node'], profession: 'Engineer', location: 'Pune' });
    const b = mentor('Bala', { skills: ['Python'], profession: 'React Developer', location: 'Mumbai' });
    const c = mentor('Chitra', { skills: ['Java'], profession: 'Analyst', location: 'Delhi' });

    test('scores skills 3, profession or field 2, location or workplace 1', () => {
        expect(rankMentors('react pune', [a, b, c])).toEqual([
            { mentor: a, score: 4 },
            { mentor: b, score: 2 },
        ]);
    });

    test('counts field and workplace matches', () => {
        const d = mentor('Dev', { field: 'Data Science', workplace: 'Infosys' });
        expect(rankMentors('data infosys', [d])).toEqual([{ mentor: d, score: 3 }]);
    });

    test('leaves out mentors with no match and handles missing profiles', () => {
        const noProfile = { userName: 'Empty' };
        expect(rankMentors('kotlin', [a, b, c, noProfile])).toEqual([]);
    });

    test('an unsearchable query matches nobody', () => {
        expect(rankMentors('I need a mentor', [a, b, c])).toEqual([]);
        expect(rankMentors('', [a, b, c])).toEqual([]);
    });

    test('breaks ties by name and returns at most ten', () => {
        const many = Array.from({ length: 12 }, (_, i) =>
            mentor(`Mentor ${String(12 - i).padStart(2, '0')}`, { skills: ['React'] }));

        const ranked = rankMentors('react', many);

        expect(ranked).toHaveLength(10);
        expect(ranked[0].mentor.userName).toBe('Mentor 01');
        expect(ranked[9].mentor.userName).toBe('Mentor 10');
    });
});

describe('mentor endpoints', () => {
    const seedMentors = async () => {
        await createVerifiedUser({ role: 'alumni', userName: 'Bala', profile: { skills: ['Python'], profession: 'React Developer', location: 'Mumbai' } });
        await createVerifiedUser({ role: 'alumni', userName: 'Asha', profile: { skills: ['React', 'Node'], profession: 'Engineer', location: 'Pune' } });
        await createVerifiedUser({ role: 'alumni', userName: 'Unverified', isVerified: false, profile: { skills: ['React'] } });
        await createVerifiedUser({ role: 'student', userName: 'Student', profile: { skills: ['React'] } });
    };

    test('lists verified alumni only, sorted by name, without secrets', async () => {
        await seedMentors();
        const agent = await loginAgent(await createVerifiedUser());

        const res = await agent.get(url);

        expect(res.status).toBe(200);
        expect(res.body.data.mentors.map((mentor) => mentor.userName)).toEqual(['Asha', 'Bala']);
        expect(res.body.data.mentors[0]).not.toHaveProperty('password');
        expect(res.body.data.mentors[0]).not.toHaveProperty('email');
    });

    test('search ranks by score and includes it', async () => {
        await seedMentors();
        const agent = await loginAgent(await createVerifiedUser());

        const res = await agent.get(`${url}/search`).query({ q: 'React developer in Pune' });

        expect(res.status).toBe(200);
        expect(res.body.data.mentors.map((mentor) => [mentor.userName, mentor.score]))
            .toEqual([['Asha', 4], ['Bala', 4]]);
    });

    test('search with an empty, missing or unsearchable q returns an empty list', async () => {
        await seedMentors();
        const agent = await loginAgent(await createVerifiedUser());

        const empty = await agent.get(`${url}/search`).query({ q: '' });
        const missing = await agent.get(`${url}/search`);
        const stopWords = await agent.get(`${url}/search`).query({ q: 'I need a mentor' });
        const repeated = await agent.get(`${url}/search?q=react&q=node`);

        for (const res of [empty, missing, stopWords]) {
            expect(res.status).toBe(200);
            expect(res.body.data.mentors).toEqual([]);
        }
        expect(repeated.status).toBe(200);
    });

    test('both endpoints require login', async () => {
        expect((await request(app).get(url)).status).toBe(401);
        expect((await request(app).get(`${url}/search`).query({ q: 'react' })).status).toBe(401);
    });
});
