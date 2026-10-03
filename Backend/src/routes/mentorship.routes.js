import { Router } from "express";
import { verifyJwt, requireRole } from '../middlewares/auth.middleware.js'
import { listMentorships, listMessages, requestMentorship, respondToMentorship } from "../controller/mentorship.controller.js";

const router = Router();

router.use(verifyJwt);

router.route('/').get(listMentorships).post(requireRole('student'), requestMentorship);
router.route('/:id').patch(respondToMentorship);
router.route('/:id/messages').get(listMessages);


export default router;
