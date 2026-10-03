import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asynchandler.js";
import jwt from 'jsonwebtoken';
import { User } from "../models/user.model.js";

const verifyJwt = asyncHandler(async (req, _, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

        if (!token) {
            throw new ApiError(401, "Unauthorised request");
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        // tokens issued for one purpose, such as opening a chat connection, are not logins
        if (decodedToken.purpose) {
            throw new ApiError(401, "Invalid access token");
        }
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken");

        if (!user) {
            throw new ApiError(401, "Invalid access token");
        }

        // logout and password reset raise the version, which ends every older session
        if (decodedToken.tokenVersion !== user.tokenVersion) {
            throw new ApiError(401, "Session expired");
        }

        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access token");
    }
})

// use after verifyJwt
const requireRole = (...roles) => (req, _, next) =>
    roles.includes(req.user?.role) ? next() : next(new ApiError(403, "You are not allowed to do this"));

export { verifyJwt, requireRole };
