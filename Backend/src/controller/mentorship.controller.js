import asyncHandler from '../utils/asynchandler.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { assertObjectId } from '../utils/objectId.js';
import { getAcceptedMentorshipFor } from '../utils/chatAccess.js';
import { User } from '../models/user.model.js';
import { Mentorship } from '../models/mentorship.model.js';
import { Message } from '../models/message.model.js';

const PARTICIPANT_FIELDS = 'userName role profile';
const DUPLICATE_KEY = 11000;

const withParticipants = (query) =>
    query.populate('student', PARTICIPANT_FIELDS).populate('mentor', PARTICIPANT_FIELDS);

const requestMentorship = asyncHandler(async (req, res) => {
    const { mentorId } = req.body;
    assertObjectId(mentorId);

    const mentor = await User.findOne({ _id: mentorId, role: 'alumni', isVerified: true });

    if (!mentor) {
        throw new ApiError(404, "Mentor not found");
    }

    let created;
    try {
        created = await Mentorship.create({ student: req.user._id, mentor: mentor._id });
    } catch (error) {
        // the unique index is the guard, so two quick clicks cannot create two requests
        if (error.code === DUPLICATE_KEY) {
            throw new ApiError(409, "You have already requested this mentor");
        }
        throw error;
    }

    const mentorship = await withParticipants(Mentorship.findById(created._id));

    return res.status(201).json(
        new ApiResponse(201, { mentorship }, "Mentorship requested")
    );
});

const listMentorships = asyncHandler(async (req, res) => {
    const mentorships = await withParticipants(
        Mentorship.find({ $or: [{ student: req.user._id }, { mentor: req.user._id }] }).sort({ createdAt: -1 })
    );

    return res.status(200).json(
        new ApiResponse(200, { mentorships }, "Mentorships")
    );
});

const respondToMentorship = asyncHandler(async (req, res) => {
    const { status } = req.body;
    assertObjectId(req.params.id);

    if (status !== 'accepted' && status !== 'declined') {
        throw new ApiError(400, "Status must be accepted or declined");
    }

    const existing = await Mentorship.findById(req.params.id);

    if (!existing) {
        throw new ApiError(404, "Mentorship not found");
    }

    if (!existing.mentor.equals(req.user._id)) {
        throw new ApiError(403, "Only the mentor can respond to this request");
    }

    // only a pending request can be answered; the filter makes the check and the update one step
    const updated = await Mentorship.findOneAndUpdate(
        { _id: existing._id, status: 'pending' },
        { status },
        { new: true }
    );

    if (!updated) {
        throw new ApiError(409, "This request has already been answered");
    }

    const mentorship = await withParticipants(Mentorship.findById(updated._id));

    return res.status(200).json(
        new ApiResponse(200, { mentorship }, `Request ${status}`)
    );
});

const listMessages = asyncHandler(async (req, res) => {
    const mentorship = await getAcceptedMentorshipFor(req.params.id, req.user._id);

    const messages = await Message.find({ mentorship: mentorship._id }).sort({ createdAt: 1 });

    return res.status(200).json(
        new ApiResponse(200, { messages }, "Messages")
    );
});

export {
    requestMentorship,
    listMentorships,
    respondToMentorship,
    listMessages
}
