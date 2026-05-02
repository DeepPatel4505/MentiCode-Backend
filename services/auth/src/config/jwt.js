import jwt from "jsonwebtoken";
import crypto from "crypto";

export const generateAccessToken = (user) => {
  return jwt.sign(
    { 
        id: user.id, 
        email: user.email,
        role: user.role,
        jti: crypto.randomBytes(16).toString("hex")
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN }
  );
};

export const generateRefreshToken = (user) => {
  return jwt.sign(
    { 
        id: user.id,
        email: user.email,
        role: user.role,
        jti: crypto.randomBytes(16).toString("hex")
    },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN }
  );
};

export const generateTemporaryToken = () => {
    const unHashedToken = crypto.randomBytes(20).toString("hex");
    console.log(unHashedToken)

    const hashedToken = crypto
                            .createHash("sha256")
                            .update(unHashedToken)
                            .digest("hex")

    const tokenExpiry = new Date(Date.now() + (20*60*1000))

    return {unHashedToken,hashedToken,tokenExpiry}
};

