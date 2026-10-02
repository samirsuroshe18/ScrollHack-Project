import { Router } from "express";
import { checkResetToken, setNewPassword, verifyEmail } from "../controller/verify.controller.js";

const router = Router();

router.route('/verify-email').get(verifyEmail);
router.route('/reset-password').get(checkResetToken);
router.route('/verify-password').post(setNewPassword);


export default router;
