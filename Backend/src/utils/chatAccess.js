import ApiError from './ApiError.js';
import { assertObjectId } from './objectId.js';
import { Mentorship } from '../models/mentorship.model.js';

// the one rule for reading or sending messages: the user is the student or the mentor
// of this mentorship, and it has been accepted
const getAcceptedMentorshipFor = async (mentorshipId, userId) => {
    assertObjectId(mentorshipId);

    const mentorship = await Mentorship.findById(mentorshipId);

    if (!mentorship) {
        throw new ApiError(404, "Mentorship not found");
    }

    const isParticipant = mentorship.student.equals(userId) || mentorship.mentor.equals(userId);

    if (!isParticipant) {
        throw new ApiError(403, "You are not part of this mentorship");
    }

    if (mentorship.status !== 'accepted') {
        throw new ApiError(403, "This mentorship is not active");
    }

    return mentorship;
};

export { getAcceptedMentorshipFor }
