import { Router } from "express";
import { verifyJwt } from '../middlewares/auth.middleware.js'
import { upload } from "../middlewares/multer.middleware.js";
import { loginUser, logoutUser, registerUser } from "../controller/user.controller.js";

const router = Router();

router.route('/register').post(registerUser);
router.route('/login').post(loginUser);

//Secure routes
router.route('/logout').get(verifyJwt, logoutUser);


export default router;