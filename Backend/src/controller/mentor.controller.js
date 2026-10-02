import asyncHandler from '../utils/asynchandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import { User } from '../models/user.model.js';
import { rankMentors } from '../utils/mentorSearch.js';

// contact details stay private until a mentorship exists
const PUBLIC_FIELDS = 'userName role state district profile';

const findMentors = () =>
    User.find({ role: 'alumni', isVerified: true })
        .select(PUBLIC_FIELDS)
        .sort({ userName: 1 })
        .lean();

const listMentors = asyncHandler(async (req, res) => {
    const mentors = await findMentors();

    return res.status(200).json(
        new ApiResponse(200, { mentors }, "Mentors")
    );
});

const searchMentors = asyncHandler(async (req, res) => {
    // ?q=a&q=b arrives as an array; treat it as one description
    const query = [req.query.q].flat().filter((part) => typeof part === 'string').join(' ');

    const ranked = rankMentors(query, await findMentors());
    const mentors = ranked.map(({ mentor, score }) => ({ ...mentor, score }));

    return res.status(200).json(
        new ApiResponse(200, { mentors }, "Mentor matches")
    );
});

export {
    listMentors,
    searchMentors
}
