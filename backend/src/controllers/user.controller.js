import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { Product } from "../models/product.model.js";
import { Review } from "../models/review.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const options = {
    httpOnly: true,
    secure: true,
};

const generateToken = async (userId) => {
    try {
      const user = await User.findById(userId); 
      if (!user) throw new ApiError(404, "User not found!");
  
      const token = jwt.sign(
        {
          _id: user._id,
          email: user.email,
          fullName: user.fullName,
        },
        process.env.TOKEN_SECRET,
      );
  
      return { token };
    } catch (error) {
      throw new ApiError(500, "Something went wrong while generating tokens!");
    }
};
  
const register = asyncHandler(async (req, res) => {
    try {
      const { fullName, email, password } = req.body;
  
      if (!email || !password) {
        throw new ApiError(400, "Email and password are mandatory.");
      }
  
      const userExistsAlready = await User.findOne({ email });
      if (userExistsAlready) {
        throw new ApiError(409, "User already exists!");
      }
  
      const user = await User.create({
        fullName,
        email,
        password,
      });
  
      const userObj = user.toObject();
      delete userObj.password;
  
      return res
        .status(201)
        .json(new ApiResponse(201, userObj, "User registered successfully"));
    } catch (error) {
      throw new ApiError(500, "Something went wrong while registering the user!");
    }
});
  
const login = asyncHandler(async (req, res) => {
    try {
      const { email, password } = req.body;
  
      if (!email || !password) {
        throw new ApiError(400, "Email and password are required!");
      }
  
      const user = await User.findOne({ email });
      if (!user) {
        throw new ApiError(404, "User does not exist!");
      }
  
      const isPasswordValid = await user.isPasswordCorrect(password);
      if (!isPasswordValid) {
        throw new ApiError(401, "Invalid password!");
      }
  
      const { token } = await generateToken(user._id);
  
      const loggedInUser = await User.findById(user._id).select("-password");
  
      return res
        .status(200)
        .cookie("token", token, options)
        .json(
          new ApiResponse(200, { user: loggedInUser, token }, "User logged in successfully")
        );
    } catch (error) {
      throw new ApiError(500, "Something went wrong while logging in the user!");
    }
});

const logout = asyncHandler(async (req, res) => {
    return res
      .status(200)
      .clearCookie("token", options)
      .json(new ApiResponse(200, {}, "User logged out successfully!"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
    return res
      .status(200)
      .json(new ApiResponse(200, req.user, "Current user fetched successfully!"));
});

const getUserById = asyncHandler(async (req, res) => {
    const { id: userId } = req.params;
    try {
      const user = await User.findById(userId).select("-password");
      if (!user) {
        throw new ApiError(404, "User does not exist!");
      }
  
      return res
        .status(200)
        .json(new ApiResponse(200, { user }, "User fetched successfully!"));
    } catch (error) {
      throw new ApiError(500, "Something went wrong while fetching this user!");
    }
});
  
const addReview = asyncHandler(async (req, res) => {
    const { id: productId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user._id;
  
    try {
      const product = await Product.findById(productId);
      if (!product) {
        throw new ApiError(404, "Product not found");
      }
  
      const alreadyReviewed = await Review.findOne({ product: productId, user: userId });
      if (alreadyReviewed) {
        throw new ApiError(400, "You have already reviewed this product");
      }
  
      const newReview = await Review.create({
        user: userId,
        product: productId,
        rating,
        comment,
      });
  
      const newCount = product.ratings.count + 1;
      const newAvg =
        (product.ratings.average * product.ratings.count + rating) / newCount;
  
      product.ratings.average = newAvg;
      product.ratings.count = newCount;
      product.reviews.push(newReview._id);
  
      await product.save();
  
      return res.status(201).json(
        new ApiResponse(201, { review: newReview }, "Review added successfully!")
      );
    } catch (error) {
      throw new ApiError(500, "Something went wrong while adding the review");
    }
});
  


export {
    generateToken,
    register,
    login,
    logout,
    getCurrentUser,
    getUserById,
    addReview,
}