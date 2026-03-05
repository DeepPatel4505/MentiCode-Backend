import crypto from "crypto";

import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";

import { comparePassword, hashPassword } from "../utils/auth/password.utils.js";

import {
  generateAccessToken,
  generateRefreshToken,
  generateTemporaryToken,
} from "../config/jwt.js";

import {
  sendEmail,
  emailVerificationMailgenContent,
  forgotPasswordMailgenContent,
} from "../utils/mail.js";

import dotenv from "dotenv";
dotenv.config()

import axios from "axios";
import { googleClient, githubConfig } from "../config/oauth.js";

import { prisma } from "../config/prisma.js";



const generateAccessAndRefreshToken = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  const tokenHash = crypto
    .createHash("sha256")
    .update(refreshToken)
    .digest("hex");

  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  return { accessToken, refreshToken };
};

const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password, role } = req.body;

  const existUser = await prisma.user.findFirst({
    where: {
      OR: [{ username }, { email }],
    },
  });

  if (existUser) {
    throw new ApiError(409, "User with email or username already exists");
  }

  const hashedPassword = await hashPassword(password);

  const { unHashedToken, hashedToken, tokenExpiry } = generateTemporaryToken();
  const user = await prisma.user.create({
    data: {
      username,
      email,
      password: hashedPassword,
      role: role || "student",
      plan: "free",
      loginProvider: "local",
      isEmailVerified: false,
      emailVerificationToken: hashedToken,
      emailVerificationExpiry: tokenExpiry,
    },
  });

  await sendEmail({
    email: user.email,
    subject: "Please verify your mail",
    mailgenContent: emailVerificationMailgenContent(
      user.username,
      `${req.protocol}://${req.get("host")}/api/v1/users/verify-email/${unHashedToken}`,
    ),
  });

  const createdUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      loginProvider: true,
      isEmailVerified: true,
      createdAt: true,
    },
  });

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        { user: createdUser },
        "User registered successfully and verification email has been sent",
      ),
    );
});
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email) {
    throw new ApiError(400, "Please provide email to login");
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new ApiError(404, "User with this email does not exist");
  }

  const isPasswordMatched = await comparePassword(password, user.password);

  if (!isPasswordMatched) {
    throw new ApiError(401, "Incorrect credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user.id,
  );

  const loggedInUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      plan: true,
      loginProvider: true,
      isEmailVerified: true,
      avatarUrl: true,
      createdAt: true,
    },
  });

  const options = {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
  };

  return res
    .status(200)
    .cookie("refreshToken", refreshToken, options)
    .cookie("accessToken", accessToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
        },
        "User logged in successfully",
      ),
    );
});
const logoutUser = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    throw new ApiError(400, "Refresh token missing");
  }

  const tokenHash = crypto
    .createHash("sha256")
    .update(refreshToken)
    .digest("hex");

  await prisma.refreshToken.updateMany({
    where: { tokenHash },
    data: {
      revokedAt: new Date(),
    },
  });

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  };

  return res
    .status(200)
    .clearCookie("refreshToken", options)
    .clearCookie("accessToken", options)
    .json(new ApiResponse(200, null, "User logged out successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        user: req.user,
      },
      "Current user fetched successfully",
    ),
  );
});
const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Refresh token is missing");
  }

  const tokenHash = crypto
    .createHash("sha256")
    .update(incomingRefreshToken)
    .digest("hex");

  const storedToken = await prisma.refreshToken.findFirst({
    where: {
      tokenHash,
      revokedAt: null,
      expiresAt: {
        gt: new Date(),
      },
    },
    include: {
      user: true,
    },
  });

  if (!storedToken) {
    throw new ApiError(401, "Invalid or expired refresh token");
  }

  const user = storedToken.user;

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user.id,
  );

  await prisma.refreshToken.update({
    where: { id: storedToken.id },
    data: {
      revokedAt: new Date(),
    },
  });

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(new ApiResponse(200, { accessToken }, "Access token refreshed"));
});

const verifyEmail = asyncHandler(async (req, res) => {
  const { verificationToken } = req.params;

  if (!verificationToken) {
    throw new ApiError(400, "Verification token is missing");
  }

  const hashedToken = crypto
    .createHash("sha256")
    .update(verificationToken)
    .digest("hex");

  const user = await prisma.user.findFirst({
    where: {
      emailVerificationToken: hashedToken,
      emailVerificationExpiry: { gt: new Date() },
    },
  });
  if (!user) {
    throw new ApiError(400, "Invalid or expired email verification token");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      isEmailVerified: true,
      emailVerificationToken: null,
      emailVerificationExpiry: null,
    },
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { isEmailVerified: true },
        "Email verified successfully",
      ),
    );
});
const resendVerificationEmail = asyncHandler(async (req, res) => {
  const user = await prisma.user.findFirst({ where: { id: req.user?.id } });
  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  if (user.isEmailVerified) {
    throw new ApiError(400, "Email is already verified");
  }

  const { unHashedToken, hashedToken, tokenExpiry } = generateTemporaryToken();

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerificationToken: hashedToken,
      emailVerificationExpiry: tokenExpiry,
    },
  });

  await sendEmail({
    email: user?.email,
    subject: "Please verify your mail",
    mailgenContent: emailVerificationMailgenContent(
      user.username,
      `${req.protocol}://${req.get("host")}/api/v1/auth/verify-email/${unHashedToken}`,
    ),
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { unHashedToken },
        "Verification email resent successfully",
      ),
    );
});

const forgotPasswordRequest = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return res
      .status(200)
      .json(new ApiResponse(200, null, "Password reset mail is sent __"));
  }

  const { unHashedToken, hashedToken, tokenExpiry } = generateTemporaryToken();
  await prisma.user.update({
    where: { email },
    data: {
      forgotPasswordToken: hashedToken,
      forgotPasswordExpiry: tokenExpiry,
    },
  });

  await sendEmail({
    email: user?.email,
    subject: "Password reset request",
    mailgenContent: forgotPasswordMailgenContent(
      user.username,
      `${process.env.FORGOT_PASSWORD_URL}/${unHashedToken}`,
    ),
  });

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Password reset mail is sent"));
});
const resetForgotPassword = asyncHandler(async (req, res) => {
  const { resetToken } = req.params;
  const { newPassword } = req.body;

  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  const user = await prisma.user.findFirst({
    where: {
      forgotPasswordToken: hashedToken,
      forgotPasswordExpiry: { gt: new Date() },
    },
  });

  if (!user) {
    throw new ApiError(401, "Token is invalid or expired");
  }

  const hashedPassword = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      forgotPasswordToken: null,
      forgotPasswordExpiry: null,
    },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Password reset successfully"));
});
const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
  });

  if (!user) {
    throw new ApiError(401, "User not found");
  }

  const passwordMatch = await comparePassword(oldPassword, user.password);

  if (!passwordMatch) {
    throw new ApiError(401, "Old password is incorrect");
  }

  const hashedPassword = await hashPassword(newPassword);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      forgotPasswordToken: null,
      forgotPasswordExpiry: null,
    },
  });

  // revoke all refresh tokens
  await prisma.refreshToken.updateMany({
    where: { userId: user.id },
    data: { revokedAt: new Date() },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Password changed successfully"));
});

const upgradeUser = asyncHandler(async (req, res) => {
  const user = req.user;

  if (!user) {
    throw new ApiError(401, "No user found");
  }
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      plan: "pro",
    },
    select: {
      id: true,
      username: true,
      email: true,
      plan: true,
      role: true,
    },
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { user: updatedUser },
        `Your plan is upgraded successfully to: ${updatedUser.plan}`,
      ),
    );
});


const googleLogin = (req, res) => {

  const url = googleClient.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: ["openid", "profile", "email"],
    redirect_uri: process.env.GOOGLE_CALLBACK_URL
  });
  console.log(url)
  res.redirect(url);
};
const googleCallback = asyncHandler(async (req, res) => {

  const { code } = req.query;
  console.log(code);
  console.log(process.env.GOOGLE_CLIENT_ID)

  const { tokens } = await googleClient.getToken({code,redirect_uri:process.env.GOOGLE_CALLBACK_URL});

  const ticket = await googleClient.verifyIdToken({
    idToken: tokens.id_token,
    audience: process.env.GOOGLE_CLIENT_ID
  });

  const payload = ticket.getPayload();

  const { email, sub, picture } = payload;

  let user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        username: email.split("@")[0],
        googleId: sub,
        avatarUrl: picture,
        loginProvider: "google",
        isEmailVerified: true
      }
    });
  }

  const { accessToken, refreshToken } =
    await generateAccessAndRefreshToken(user.id);

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict"
  };

  res
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .redirect(process.env.FRONTEND_URL);

});

const githubLogin = (req, res) => {

  const url =
    `${githubConfig.authorizeUrl}?` +
    `client_id=${process.env.GITHUB_CLIENT_ID}` +
    `&scope=repo user:email` +   // repo access
    `&redirect_uri=${process.env.GITHUB_CALLBACK_URL}`;

  res.redirect(url);

};
const githubCallback = asyncHandler(async (req, res) => {

  const { code } = req.query;

  const tokenResponse = await axios.post(
    githubConfig.tokenUrl,
    {
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code
    },
    {
      headers: { Accept: "application/json" }
    }
  );

  const githubAccessToken = tokenResponse.data.access_token;

  const userResponse = await axios.get(
    githubConfig.userUrl,
    {
      headers: {
        Authorization: `Bearer ${githubAccessToken}`
      }
    }
  );

  const { id, login, avatar_url } = userResponse.data;

  const emailResponse = await axios.get(
    githubConfig.emailUrl,
    {
      headers: {
        Authorization: `Bearer ${githubAccessToken}`
      }
    }
  );

  const email = emailResponse.data.find(e => e.primary).email;
  const githubUserId = id.toString();

  let user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        username: login,
        githubId: githubUserId,
        avatarUrl: avatar_url,
        loginProvider: "github",
        isEmailVerified: true,
        githubAccessToken
      }
    });
  } else {
    if (user.githubId && user.githubId !== githubUserId) {
      throw new ApiError(409, "GitHub account does not match existing user");
    }

    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        githubAccessToken,
        githubId: user.githubId ?? githubUserId,
        isEmailVerified: true
      }
    });
  }

  const { accessToken, refreshToken } =
    await generateAccessAndRefreshToken(user.id);

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict"
  };

  res
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .redirect(process.env.FRONTEND_URL);

});

export {
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
};
