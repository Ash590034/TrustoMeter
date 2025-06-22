import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { Moderator } from "../models/moderator.model.js";

export const verifyJWTUser = asyncHandler(async (req, res, next) => {
    try {
        const token = req.cookies?.token || req.header("Authorization")?.replace("Bearer ", "");

        if (!token) throw new ApiError(401, "Unauthorized Access!");

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        const user = await User.findById(decoded?._id).select("-password");
        if (!user) throw new ApiError(401, "Invalid token!");
        req.user = user;

        next();
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid token!");
    }
});

export const verifyJWTModerator = asyncHandler(async (req, res, next) => {
    try {
        const token = req.cookies?.token || req.header("Authorization")?.replace("Bearer ", "");
        
        if (!token) throw new ApiError(401, "Unauthorized Access!");

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const moderator = await Moderator.findById(decoded?._id).select("-password");

        if (!moderator) throw new ApiError(401, "Invalid token!");
        req.moderator = moderator;
        next();
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid token!");
    }
});