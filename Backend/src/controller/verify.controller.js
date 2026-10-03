import { User } from '../models/user.model.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asynchandler.js';
import { endSessions } from '../utils/sessions.js';

const MIN_PASSWORD_LENGTH = 6;

// a token only matches when it is a non-empty string that has not expired
const findByToken = async (tokenField, expiryField, token) => {
  if (typeof token !== 'string' || !token) return null;
  return User.findOne({ [tokenField]: token, [expiryField]: { $gt: Date.now() } });
};

const verifyEmail = asyncHandler(async (req, res) => {
  const user = await findByToken('verifyToken', 'verifyTokenExpiry', req.query.token);

  if (!user) {
    throw new ApiError(400, "Invalid or expired link");
  }

  user.isVerified = true;
  user.verifyToken = undefined;
  user.verifyTokenExpiry = undefined;
  await user.save();

  return res.status(200).json(
    new ApiResponse(200, {}, "Email verified")
  );
});

const checkResetToken = asyncHandler(async (req, res) => {
  const user = await findByToken('forgotPasswordToken', 'forgotPasswordTokenExpiry', req.query.token);

  if (!user) {
    throw new ApiError(400, "Invalid or expired link");
  }

  return res.status(200).json(
    new ApiResponse(200, {}, "Link is valid")
  );
});

const setNewPassword = asyncHandler(async (req, res) => {
  const { password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    throw new ApiError(400, "Passwords do not match");
  }

  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
    throw new ApiError(400, "Password must be at least 6 characters");
  }

  const user = await findByToken('forgotPasswordToken', 'forgotPasswordTokenExpiry', req.query.token);

  if (!user) {
    throw new ApiError(400, "Invalid or expired link");
  }

  user.forgotPasswordToken = undefined;
  user.forgotPasswordTokenExpiry = undefined;
  user.password = password;
  await user.save();

  // anyone still logged in with the old password is signed out
  await endSessions(user._id);

  return res.status(200).json(
    new ApiResponse(200, {}, "Password updated")
  );
});

export {
  verifyEmail,
  checkResetToken,
  setNewPassword
}
