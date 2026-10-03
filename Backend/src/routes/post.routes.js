import { Router } from "express";
import { verifyJwt, requireRole } from '../middlewares/auth.middleware.js'
import { createPost, listPosts } from "../controller/post.controller.js";

const router = Router();

router.use(verifyJwt);

router.route('/').get(listPosts).post(requireRole('alumni'), createPost);


export default router;
