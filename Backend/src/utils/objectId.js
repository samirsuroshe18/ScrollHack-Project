import ApiError from './ApiError.js';

const OBJECT_ID_PATTERN = /^[a-f0-9]{24}$/i;

// ids arrive from URLs and request bodies; anything but a 24-character hex string is refused
// before it reaches a query
const assertObjectId = (value) => {
    if (typeof value !== 'string' || !OBJECT_ID_PATTERN.test(value)) {
        throw new ApiError(400, "Invalid id");
    }
};

export { assertObjectId }
