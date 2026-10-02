import mongoose, { Schema } from "mongoose";

export const POST_TYPES = ['success_story', 'job'];
export const POST_MAX_LENGTH = 2000;

const postSchema = new Schema({
    author: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },

    type: {
        type: String,
        enum: POST_TYPES,
        required: true,
    },

    content: {
        type: String,
        required: true,
        trim: true,
        maxlength: POST_MAX_LENGTH,
    },

}, { timestamps: true });

postSchema.index({ type: 1, createdAt: -1 });

export const Post = mongoose.model("Post", postSchema);
