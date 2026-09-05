import User from "../models/User.js";
import bcrypt from "bcrypt";
import { json } from "express";
import jwt from "jsonwebtoken";
import Employee from "../models/Employee.js";
import { OAuth2Client } from "google-auth-library";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Login for employee and admin
// POST /api/auth/login

export const login = async (req, res) => {
  try {
    const { email, password, role_type } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    if (role_type === "admin" && user.role !== "ADMIN") {
      return res.status(401).json({ error: "Not authorized as admin" });
    }
    if (role_type === "employee" && user.role !== "EMPLOYEE") {
      return res.status(401).json({ error: "Not authorized as employee" });
    }
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: "Invlaid credentials" });
    }

    const payLoad = {
      userId: user._id.toString(),
      role: user.role,
      email: user.email,
    };

    const token = jwt.sign(payLoad, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    return res.json({ user: payLoad, token });
  } catch (error) {
    console.error("Login error", error);
    return res.status(500).json({ error: "Login failed" });
  }
};
export const googleLogin = async (req, res) => {
  try {
    const { credential, role_type } = req.body;

    if (!credential) {
      return res.status(400).json({
        error: "Google credential is required",
      });
    }

    if (!role_type) {
      return res.status(400).json({
        error: "Role is required",
      });
    }

    // Verify Google ID token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    const googleId = payload.sub;
    const email = payload.email?.toLowerCase();
    const emailVerified = payload.email_verified;

    if (!email || !emailVerified) {
      return res.status(401).json({
        error: "Google email could not be verified",
      });
    }

    // Find existing EMS user
    const user = await User.findOne({
      email,
    });

    if (!user) {
      return res.status(404).json({
        error:
          "No EMS account exists for this Google account. Please contact the administrator.",
      });
    }

    // Check portal role
    if (role_type === "admin" && user.role !== "ADMIN") {
      return res.status(401).json({
        error: "Not authorized as admin",
      });
    }

    if (role_type === "employee" && user.role !== "EMPLOYEE") {
      return res.status(401).json({
        error: "Not authorized as employee",
      });
    }

    // Store Google account ID
    if (!user.googleId) {
      user.googleId = googleId;
    }

    // Store Google profile picture if available
    if (payload.picture && !user.profilePicture) {
      user.profilePicture = payload.picture;
    }

    await user.save();

    // Create the same JWT payload
    // used by your existing login
    const payLoad = {
      userId: user._id.toString(),
      role: user.role,
      email: user.email,
    };

    const token = jwt.sign(payLoad, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    return res.json({
      user: payLoad,
      token,
    });
  } catch (error) {
    console.error("Google Login Error:", error);

    return res.status(401).json({
      error: "Google login failed",
    });
  }
};

// Get session  forn employee and admin
//  GET /api/auth/session
export const session = (req, res) => {
  const session = req.session;
  return res.json({ user: session });
};

// Chnage password for employee and admin
// POST /api/auth/change-password
// export const changePassowrd = async (req, res) => {
//   try {
//     const session = req.session;
//     const { currentPassword, newPassword } = req.body;
//     if (!currentPassword || !newPassword) {
//       return res.status(400).json({ error: "Both passwords are required" });
//     }
//     const user = await User.findById(session.userId);
//     if (!user) return res.status(404).json({ error: "User not found" });
//     const isValid = await bcrypt.compare(currentPassword, user.password);
//     if (!isValid)
//       return res.status(400).json({ error: "Current password is incorrect" });
//     const hashed = await bcrypt.hash(session.userId, { password: hashed });
//     return res.json({ success: true });
//   } catch (error) {
//     return res.status(500).json({ error: "Failed to change password" });
//   }
// };
export const changePassowrd = async (req, res) => {
  try {
    const session = req.session;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: "Both passwords are required",
      });
    }

    const user = await User.findById(session.userId);

    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);

    if (!isValid) {
      return res.status(400).json({
        error: "Current password is incorrect",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    await user.save();

    return res.json({
      success: true,
    });
  } catch (error) {
    console.error("Change Password Error:", error);

    return res.status(500).json({
      error: "Failed to change password",
    });
  }
};
