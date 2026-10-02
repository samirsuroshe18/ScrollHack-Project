import express from "express";
import cors from 'cors';
import cookieParser from "cookie-parser";
import ApiError from './utils/ApiError.js';
import ApiResponse from './utils/ApiResponse.js';
import userRouter from './routes/user.route.js';
import verifyRouter from './routes/verify.routes.js';
import postRouter from './routes/post.routes.js';
import mentorRouter from './routes/mentor.routes.js';
import mentorshipRouter from './routes/mentorship.routes.js';

const app = express();

// allow the frontend origin to send the auth cookies
app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/api/v1/health", (req, res) => {
    return res.status(200).json(new ApiResponse(200, { status: 'ok' }, "OK"));
});

app.use("/api/v1/users", userRouter);
app.use("/api/v1/verify", verifyRouter);
app.use("/api/v1/posts", postRouter);
app.use("/api/v1/mentors", mentorRouter);
app.use("/api/v1/mentorships", mentorshipRouter);

app.use((req, res, next) => {
    next(new ApiError(404, "Route not found"));
});

// Custom error handling
app.use((err, req, res, next) => {
    const isValidationError = err.name === 'ValidationError';
    const statusCode = err.statusCode || (isValidationError ? 400 : 500);
    // an unexpected failure can carry database or stack details, so only messages
    // written for the client (ApiError) or for a 4xx are sent back
    const isUnexpected = statusCode >= 500 && !(err instanceof ApiError);
    const message = isUnexpected ? "Internal server error" : (err.message || "Internal server error");

    if (statusCode >= 500) {
        console.log(err);
    }

    return res.status(statusCode).json({
        statusCode: statusCode,
        message: message,
        success: false
    });
})

export default app
