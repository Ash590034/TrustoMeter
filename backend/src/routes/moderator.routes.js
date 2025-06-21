import { Router } from "express";
import { verifyJWTModerator } from "../middlewares/auth.middleware.js";
import {
  registerModerator,
  loginModerator,
  logoutModerator,
  getFlaggedProductsAndReviews,
  dismissFlaggedProduct,
  dismissFlaggedReview,
  approveFlaggedProduct,
  approveFlaggedReview,
} from "../controllers/moderator.controller.js";

const router = Router();

router.post("/register", registerModerator);
router.post("/login", loginModerator);

router.post("/logout", verifyJWTModerator, logoutModerator);

router.get("/flagged", verifyJWTModerator, getFlaggedProductsAndReviews);

router.delete("/dismiss/product/:id", verifyJWTModerator, dismissFlaggedProduct);
router.delete("/dismiss/review/:id", verifyJWTModerator, dismissFlaggedReview);

router.patch("/approve/product/:id", verifyJWTModerator, approveFlaggedProduct);
router.patch("/approve/review/:id", verifyJWTModerator, approveFlaggedReview);

export default router;
