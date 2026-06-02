import User from "../models/User.js";
import bcrypt from "bcrypt";
import { json } from "express";
import jwt from "jsonwebtoken";
import Employee from "../models/Employee.js";

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

// Get session  forn employee and admin
//  GET /api/auth/session
export const session = (req, res) => {
  const session = req.session;
  return res.json({ user: session });
};

// Chnage password for employee and admin
// POST /api/auth/change-password
export const changePassowrd = async (req, res) => {
  try {
    const session = req.session;
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Both passwords are required" });
    }
    const user = await User.findById(session.userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid)
      return res.status(400).json({ error: "Current password is incorrect" });
    const hashed = await bcrypt.hash(session.userId, { password: hashed });
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: "Failed to change password" });
  }
};
