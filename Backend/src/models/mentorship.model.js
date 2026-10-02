import mongoose, { Schema } from "mongoose";

export const MENTORSHIP_STATUSES = ['pending', 'accepted', 'declined'];

const mentorshipSchema = new Schema({
    student: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },

    mentor: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },

    status: {
        type: String,
        enum: MENTORSHIP_STATUSES,
        default: 'pending',
    },

}, { timestamps: true });

// one request per student and mentor
mentorshipSchema.index({ student: 1, mentor: 1 }, { unique: true });

export const Mentorship = mongoose.model("Mentorship", mentorshipSchema);
