import mongoose, { Schema } from "mongoose";

export const MESSAGE_MAX_LENGTH = 1000;

const messageSchema = new Schema({
    mentorship: {
        type: Schema.Types.ObjectId,
        ref: "Mentorship",
        required: true,
        index: true,
    },

    sender: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },

    text: {
        type: String,
        required: true,
        trim: true,
        maxlength: MESSAGE_MAX_LENGTH,
    },

}, { timestamps: true });

export const Message = mongoose.model("Message", messageSchema);
