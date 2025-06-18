import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
    try {
        const token = req.cookies?.jwt || req.header("Authorization")?.replace("Bearer ", "");
        if (!token) throw new ApiError(401, "No token provided!");

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded?._id).select("-password");
        if (!user) throw new ApiError(401, "Invalid token!");
        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid token!");
    }
});
