import { Router } from "express";
import { verifyJWTUser } from "../middlewares/auth.middleware.js";
import { 
    register,
    login, 
    logout, 
    getProducts,
    getProductsByCategory,
    addReview 
} from "../controllers/user.controller.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", verifyJWTUser, logout);
router.get("/products",getProducts)
router.get("/products/category/:id",getProductsByCategory)
router.post("/:id/review", verifyJWTUser, addReview);

export default router;
