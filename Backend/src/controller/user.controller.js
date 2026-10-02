import asyncHandler from '../utils/asynchandler.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { User, ROLES } from '../models/user.model.js';
import mailSender from '../utils/mailSender.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;
const PROFILE_TEXT_FIELDS = ['profession', 'field', 'workplace', 'location', 'availability', 'bio'];

// the cookie must only require https in production, otherwise it is dropped on http://localhost
const cookieOptions = () => ({
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
});

const normalizeEmail = (email) => (typeof email === 'string' ? email.trim().toLowerCase() : '');

const text = (value) => (typeof value === 'string' ? value.trim() : '');

// accepts ["React", "Node"] or "React, Node"
const parseSkills = (skills) => {
    const list = Array.isArray(skills) ? skills : String(skills).split(',');
    return list.map((skill) => String(skill).trim()).filter(Boolean);
};

// returns only the profile fields that were sent, already validated
const readProfile = (profile) => {
    const changes = {};
    if (!profile || typeof profile !== 'object') return changes;

    for (const field of PROFILE_TEXT_FIELDS) {
        if (profile[field] !== undefined) changes[field] = text(profile[field]);
    }

    if (profile.skills !== undefined) {
        changes.skills = parseSkills(profile.skills);
    }

    if (profile.passingYear !== undefined && profile.passingYear !== '' && profile.passingYear !== null) {
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
    const { password, role, phoneNo, state, district, profile } = req.body;
    const userName = text(req.body.userName);
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

    const existedUser = await User.findOne({ email });

    if (existedUser) {
        throw new ApiError(409, 'An account with this email already exists');
    }

    const user = await User.create({
        userName,
        email,
        password,
        role,
        phoneNo: text(phoneNo),
        state: text(state),
        district: text(district),
        profile: readProfile(profile),
    });

    const mailResponse = await mailSender(email, user._id, "VERIFY");

    if (!mailResponse) {
        throw new ApiError(500, "Account created, but the verification email could not be sent");
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
        await mailSender(email, user._id, "VERIFY");
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

    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1
            }
        },
        {
            new: true
        }
    );

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
        const userName = text(req.body.userName);
        if (!userName) {
            throw new ApiError(400, "Name cannot be empty");
        }
        user.userName = userName;
    }

    for (const field of ['phoneNo', 'state', 'district']) {
        if (req.body[field] !== undefined) user[field] = text(req.body[field]);
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
