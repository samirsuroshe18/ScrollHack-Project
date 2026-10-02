import asyncHandler from '../utils/asynchandler.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { Post, POST_TYPES, POST_MAX_LENGTH } from '../models/post.model.js';

// what a reader needs to know about who wrote a post
const AUTHOR_FIELDS = 'userName profile.profession profile.workplace';

const assertPostType = (type) => {
    if (!POST_TYPES.includes(type)) {
        throw new ApiError(400, "Type must be success_story or job");
    }
};

const listPosts = asyncHandler(async (req, res) => {
    const filter = {};

    if (req.query.type !== undefined) {
        assertPostType(req.query.type);
        filter.type = req.query.type;
    }

    const posts = await Post.find(filter)
        .sort({ createdAt: -1 })
        .populate('author', AUTHOR_FIELDS);

    return res.status(200).json(
        new ApiResponse(200, { posts }, "Posts")
    );
});

const createPost = asyncHandler(async (req, res) => {
    const { type } = req.body;
    const content = typeof req.body.content === 'string' ? req.body.content.trim() : '';

    assertPostType(type);

    if (!content) {
        throw new ApiError(400, "Content is required");
    }

    if (content.length > POST_MAX_LENGTH) {
        throw new ApiError(400, "Content must be at most 2000 characters");
    }

    const created = await Post.create({ author: req.user._id, type, content });
    const post = await created.populate('author', AUTHOR_FIELDS);

    return res.status(201).json(
        new ApiResponse(201, { post }, "Post created")
    );
});

export {
    listPosts,
    createPost
}
