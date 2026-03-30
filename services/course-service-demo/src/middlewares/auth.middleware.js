import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/async-handler.js";
import { ApiError } from "../utils/api-error.js";

// In course-service, we verify the JWT but do NOT hit the DB —
// user-service already validated the user on login.
// The token payload contains { id, email } — enough for ownership checks.
export const verifyJWT = asyncHandler(async (req, res, next) => {
  const token =
    req.cookies?.accessToken ||
    req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    throw new ApiError(401, "Unauthorized Access");
  }

  try {
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    req.user = decodedToken; // { id, email, iat, exp }
    next();
  } catch (e) {
    throw new ApiError(401, "Invalid or expired access token");
  }
});

// Restricts to specific roles stored in the token payload.
// Usage: verifyJWT, authorizeRoles("admin")
export const authorizeRoles = (...roles) =>
  asyncHandler(async (req, res, next) => {
    if (!req.user) throw new ApiError(401, "Unauthorized Access");
    if (!roles.includes(req.user.role)) {
      throw new ApiError(403, "You do not have permission to perform this action");
    }
    next();
  });

// Optionally attaches user if a valid token is present — never throws.
// Usage: optionalAuth (public routes that behave differently for logged-in users)
export const optionalAuth = (req, res, next) => {
  const token =
    req.cookies?.accessToken ||
    req.header("Authorization")?.replace("Bearer ", "");

  if (token) {
    try {
      req.user = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    } catch (e) {
      // invalid/expired token — treat as unauthenticated
    }
  }
  next();
};
