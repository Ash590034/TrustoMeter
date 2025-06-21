import { Router } from "express";
import { verifyJWTUser } from "../middlewares/auth.middleware.js";
import { 
    register,
    login, 
    logout, 
    getProducts,
    getProductsByCategory,
    addReview,
    addProduct,
    getCurrentUser,
    getUserById,
    getAllReviewsForProduct
} from "../controllers/user.controller.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", verifyJWTUser, logout);

router.get("/me", verifyJWTUser, getCurrentUser);

router.get("/products", getProducts);
router.post("/products", verifyJWTUser, addProduct); // ✅ Added this line
router.get("/products/category/:id", getProductsByCategory);
router.get("/products/:id/reviews", getAllReviewsForProduct);
router.post("/products/:id/reviews", verifyJWTUser, addReview);

router.get("/sellers/:id", getUserById);

export default router;
