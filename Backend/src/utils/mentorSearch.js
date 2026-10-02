const STOP_WORDS = new Set([
    'the', 'and', 'for', 'with', 'who', 'that', 'need', 'want', 'looking', 'help',
    'mentor', 'mentors', 'someone', 'can', 'from', 'about', 'have', 'are', 'any',
    'mentorship', 'guide', 'guidance', 'good', 'experience', 'experienced',
]);

const MIN_TERM_LENGTH = 3;
const MAX_RESULTS = 10;

const SKILL_POINTS = 3;
const ROLE_POINTS = 2;
const PLACE_POINTS = 1;

// "I need a React mentor in Pune" -> ['react', 'pune']
const tokenize = (text) => {
    if (typeof text !== 'string') return [];

    const terms = text
        .toLowerCase()
        .split(/[^a-z0-9+#]+/)
        .filter((term) => term.length >= MIN_TERM_LENGTH && !STOP_WORDS.has(term));

    return [...new Set(terms)];
};

const includesTerm = (values, term) =>
    values.some((value) => typeof value === 'string' && value.toLowerCase().includes(term));

const scoreMentor = (terms, mentor) => {
    const profile = mentor.profile || {};
    const skills = profile.skills || [];
    const roles = [profile.profession, profile.field];
    const places = [profile.location, profile.workplace];

    let score = 0;
    for (const term of terms) {
        if (includesTerm(skills, term)) score += SKILL_POINTS;
        if (includesTerm(roles, term)) score += ROLE_POINTS;
        if (includesTerm(places, term)) score += PLACE_POINTS;
    }
    return score;
};

// returns [{ mentor, score }] for mentors that match, best first, at most ten
const rankMentors = (query, alumni) => {
    const terms = tokenize(query);
    if (terms.length === 0) return [];

    return alumni
        .map((mentor) => ({ mentor, score: scoreMentor(terms, mentor) }))
        .filter((entry) => entry.score > 0)
        .sort((a, b) => b.score - a.score || a.mentor.userName.localeCompare(b.mentor.userName))
        .slice(0, MAX_RESULTS);
};

export { tokenize, rankMentors }
