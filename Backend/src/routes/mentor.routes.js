import { Router } from "express";
import { verifyJwt } from '../middlewares/auth.middleware.js'
import { listMentors, searchMentors } from "../controller/mentor.controller.js";

const router = Router();

router.use(verifyJwt);

router.route('/').get(listMentors);
router.route('/search').get(searchMentors);


export default router;
