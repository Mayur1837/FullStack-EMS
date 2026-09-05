import { Router } from "express";
import {
  changePassowrd,
  login,
  session,
  googleLogin,
} from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";

const authRouter = Router();

authRouter.post("/login", login);
authRouter.post("/google", googleLogin);
authRouter.get("/session", protect, session);
authRouter.post("/change-password", protect, changePassowrd);

export default authRouter;
