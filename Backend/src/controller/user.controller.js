import asyncHandler from '../utils/asynchandler.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { User, ROLES } from '../models/user.model.js';
import mailSender from '../utils/mailSender.js';
import { endSessions } from '../utils/sessions.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;
const DUPLICATE_KEY = 11000;

// label shown in error messages, and the longest value accepted
const PROFILE_TEXT_FIELDS = {
    profession: ['Profession', 120],
    field: ['Field', 120],
    workplace: ['Workplace', 120],
    location: ['Location', 120],
    availability: ['Availability', 120],
    bio: ['About you', 1000],
};
const NAME_MAX = 80;
const PHONE_MAX = 20;
const PLACE_MAX = 80;
const SKILLS_MAX = 20;
const SKILL_MAX_LENGTH = 40;

// the cookie must only require https in production, otherwise it is dropped on http://localhost
const cookieOptions = () => ({
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
});

const normalizeEmail = (email) => (typeof email === 'string' ? email.trim().toLowerCase() : '');

// Reads a text field from a request body. A number is accepted as text (a phone number
// often arrives as one); anything else is refused, so a bad value never erases a stored one.
const readText = (value, label, maxLength) => {
    if (value === undefined || value === null) return '';

    if (typeof value !== 'string' && typeof value !== 'number') {
        throw new ApiError(400, `${label} must be text`);
    }

    const result = String(value).trim();

    if (result.length > maxLength) {
        throw new ApiError(400, `${label} must be at most ${maxLength} characters`);
    }

    return result;
};

// accepts ["React", "Node"] or "React, Node"; entries that are not text are dropped
const parseSkills = (skills) => {
    const list = Array.isArray(skills) ? skills : (typeof skills === 'string' ? skills.split(',') : []);
    const cleaned = list
        .filter((skill) => typeof skill === 'string')
        .map((skill) => skill.trim())
        .filter(Boolean);

    if (cleaned.length > SKILLS_MAX) {
        throw new ApiError(400, "You can list at most 20 skills");
    }

    if (cleaned.some((skill) => skill.length > SKILL_MAX_LENGTH)) {
        throw new ApiError(400, "Each skill must be at most 40 characters");
    }

    return cleaned;
};

// returns only the profile fields that were sent, already validated
const readProfile = (profile) => {
    const changes = {};
    if (!profile || typeof profile !== 'object') return changes;

    for (const [field, [label, maxLength]] of Object.entries(PROFILE_TEXT_FIELDS)) {
        if (profile[field] !== undefined) changes[field] = readText(profile[field], label, maxLength);
    }

    if (profile.skills !== undefined) {
        changes.skills = parseSkills(profile.skills);
    }

    if (profile.passingYear === '' || profile.passingYear === null) {
        // sent empty: the user cleared the field
        changes.passingYear = undefined;
    } else if (profile.passingYear !== undefined) {
        const year = Number(profile.passingYear);
        if (!Number.isInteger(year) || year < 1950 || year > 2100) {
            throw new ApiError(400, "Passing year must be a year between 1950 and 2100");
        }
        changes.passingYear = year;
    }

    return changes;
};

const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;

        // when we use save() method is used then all the fields are neccesary so to avoid that we have to pass an object with property {validatBeforeSave:false}
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken }
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access token");
    }
}

const registerUser = asyncHandler(async (req, res) => {
    const { password, role } = req.body;
    const userName = readText(req.body.userName, 'Name', NAME_MAX);
    const email = normalizeEmail(req.body.email);

    if (!userName || !email || !password || !role) {
        throw new ApiError(400, "Name, email, password and role are required");
    }

    if (!ROLES.includes(role)) {
        throw new ApiError(400, "Role must be student or alumni");
    }

    if (!EMAIL_PATTERN.test(email)) {
        throw new ApiError(400, "Enter a valid email address");
    }

    if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
        throw new ApiError(400, "Password must be at least 6 characters");
    }

    // every field is checked before anything is saved
    const details = {
        phoneNo: readText(req.body.phoneNo, 'Mobile number', PHONE_MAX),
        state: readText(req.body.state, 'State', PLACE_MAX),
        district: readText(req.body.district, 'District', PLACE_MAX),
        profile: readProfile(req.body.profile),
    };

    const existedUser = await User.findOne({ email });

    if (existedUser) {
        throw new ApiError(409, 'An account with this email already exists');
    }

    let user;
    try {
        user = await User.create({ userName, email, password, role, ...details });
    } catch (error) {
        // two sign-ups can pass the check above at the same moment; the unique index decides
        if (error.code === DUPLICATE_KEY) {
            throw new ApiError(409, 'An account with this email already exists');
        }
        throw error;
    }

    const mailResponse = await mailSender(email, user._id, "VERIFY");

    if (!mailResponse) {
        // logging in with an unverified account sends a fresh link
        throw new ApiError(500, "Account created, but the verification email could not be sent. Log in to get a new link.");
    }

    return res.status(201).json(
        new ApiResponse(201, {}, "Verification email sent. Please verify within 10 minutes.")
    );
});

const loginUser = asyncHandler(async (req, res) => {
    const email = normalizeEmail(req.body.email);
    const { password } = req.body;

    if (!email || !password) {
        throw new ApiError(400, "Email and password are required");
    }

    const user = await User.findOne({ email });

    // the same answer for an unknown email and a wrong password, so accounts cannot be probed
    // you cant access isPasswordCorrect method directly through 'User' beacause User is mogoose object
    // these methods is applied only the instance of the user when mongoose return its instance
    if (!user || !(await user.isPasswordCorrect(String(password)))) {
        throw new ApiError(401, "Invalid email or password");
    }

    if (!user.isVerified) {
        const mailResponse = await mailSender(email, user._id, "VERIFY");

        if (!mailResponse) {
            throw new ApiError(500, "Email not verified, and a new verification link could not be sent. Please try again later.");
        }

        throw new ApiError(403, "Email not verified. A new verification link has been sent.");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

    const loggedInUser = await User.findById(user._id);

    return res.status(200)
        .cookie('accessToken', accessToken, cookieOptions())
        .cookie('refreshToken', refreshToken, cookieOptions())
        .json(new ApiResponse(200, { user: loggedInUser }, "Logged in"));
});

const logoutUser = asyncHandler(async (req, res) => {

    await endSessions(req.user._id);

    return res.status(200)
        .clearCookie("accessToken", cookieOptions())
        .clearCookie("refreshToken", cookieOptions())
        .json(new ApiResponse(200, {}, "Logged out"));
});

const getMe = asyncHandler(async (req, res) => {
    return res.status(200).json(
        new ApiResponse(200, { user: req.user }, "Current user")
    );
});

// role, email, password and verification state are deliberately not editable here
const updateMe = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (req.body.userName !== undefined) {
        const userName = readText(req.body.userName, 'Name', NAME_MAX);
        if (!userName) {
            throw new ApiError(400, "Name cannot be empty");
        }
        user.userName = userName;
    }

    const details = { phoneNo: ['Mobile number', PHONE_MAX], state: ['State', PLACE_MAX], district: ['District', PLACE_MAX] };
    for (const [field, [label, maxLength]] of Object.entries(details)) {
        if (req.body[field] !== undefined) user[field] = readText(req.body[field], label, maxLength);
    }

    const profileChanges = readProfile(req.body.profile);
    for (const [field, value] of Object.entries(profileChanges)) {
        user.profile[field] = value;
    }

    await user.save();

    return res.status(200).json(
        new ApiResponse(200, { user }, "Profile updated")
    );
});

const forgotPassword = asyncHandler(async (req, res) => {
    const email = normalizeEmail(req.body.email);

    if (!email) {
        throw new ApiError(400, "Email is required");
    }

    const user = await User.findOne({ email });

    if (user) {
        await mailSender(email, user._id, "RESET");
    }

    // the same answer either way, so the form cannot be used to find registered emails
    return res.status(200).json(
        new ApiResponse(200, {}, "If that email is registered, a reset link has been sent.")
    );
});


export {
    registerUser,
    loginUser,
    logoutUser,
    getMe,
    updateMe,
    forgotPassword
}
