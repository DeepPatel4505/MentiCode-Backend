import { Router } from "express";

import {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  verifyEmail,
  resendVerificationEmail,
  forgotPasswordRequest,
  resetForgotPassword,
  changePassword,
  refreshAccessToken,
  upgradeUser,
  googleLogin,
  googleCallback,
  githubLogin,
  githubCallback,
  githubConnect,
  refreshGithubToken
} from "../controllers/auth.controller.js";

import {
  userRegistrationValidator,
  userLoginValidator,
  userChangeCurrentPasswordValidator,
  userForgotPasswordValidator,
  userResetForgotPasswordValidator,
} from "../validators/index.js";

import { validate } from "../middlewares/validator.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

//unsecure routes
router.get("/test", (req, res) => {
  res.json({ message: "Auth route is working!" });
});
router.route("/register").post(userRegistrationValidator(),validate,registerUser);
router.route("/login").post(userLoginValidator(),validate,loginUser);
router.route("/verify-email/:verificationToken").get(verifyEmail);
router
  .route("/forgot-password")
  .get(userForgotPasswordValidator(), validate, forgotPasswordRequest);
router
  .route("/reset-forgot-password/:resetToken")
  .post(userResetForgotPasswordValidator(), validate, resetForgotPassword);
router.route("/refresh").post(refreshAccessToken);

router.get("/google", googleLogin);
router.get("/google/callback", googleCallback);

router.get("/github", githubLogin);
router.get("/github/callback", githubCallback);



//secure routes
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/me").get(verifyJWT, getCurrentUser);
router.route("/github/token/refresh").get(verifyJWT, refreshGithubToken);
router
  .route("/resend-email-verification")
  .post(verifyJWT, resendVerificationEmail);
router.route("/change-password").post(verifyJWT, userChangeCurrentPasswordValidator(), validate, changePassword)
router.route("/upgrade").post(verifyJWT,upgradeUser);
router.route("/github/connect").get(verifyJWT, githubConnect);

export default router;
