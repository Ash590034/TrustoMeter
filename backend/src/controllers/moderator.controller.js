import { Product } from "../models/product.model.js";
import { User } from "../models/user.model.js";
import { Review } from "../models/review.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from 'jsonwebtoken';
import { Moderator } from "../models/moderator.model.js"

const options = {
  httpOnly: true,
  secure: true,
  sameSite: "lax"
};

const generateModeratorToken = async (moderatorId) => {
  const moderator = await Moderator.findById(moderatorId);

  if (!moderator) throw new ApiError(404, 'Moderator not found!');

  const token = jwt.sign(
    { _id: moderator._id, email: moderator.email, fullName: moderator.fullName },
    process.env.JWT_SECRET,
  );
  return { token };
};

const registerModerator = asyncHandler(async (req, res) => {
  try {
    const { fullName, email, password } = req.body;
  
    if (!email || !password) throw new ApiError(400, 'Email and password are mandatory!');
  
    const existingModerator = await User.findOne({ email })
    if (existingModerator) throw new ApiError(409, 'Moderator already exists!');
  
    const moderator = await Moderator.create({ fullName, email, password });
  
    const moderatorObj = moderator.toObject();
    delete moderatorObj.password;

    const { token } = await generateModeratorToken(moderator._id);
  
    res
    .status(201)
    .cookie('token', token, options)
    .json(new ApiResponse(201, {moderator: moderatorObj}, 'Moderator registered successfully!'));
  } catch (error) {
    throw new ApiError(500, "Something went wrong while registering the moderator!");
  }
});

const loginModerator = asyncHandler(async (req, res) => {
  try {
    const { email, password } = req.body;
  
    if (!email || !password) throw new ApiError(400, 'Email and password are required!');
  
    const moderator = await Moderator.findOne({ email });
  
    if (!moderator) throw new ApiError(404, 'Moderator does not exist!');
  
    const isPasswordCorrect = await moderator.isPasswordCorrect(password)
    if (!isPasswordCorrect) throw new ApiError(401, 'Incorrect password!');
  
    const { token } = await generateModeratorToken(moderator._id);
    const safeModerator = await Moderator.findById(moderator._id).select('-password');
  
    res
      .status(200)
      .cookie('token', token, options)
      .json(new ApiResponse(200, { moderator: safeModerator, token }, 'Moderator logged in successfully!'));
  } catch (error) {
    throw new ApiError(500, "Something went wrong while logging in the moderator!");
  }
});

const logoutModerator = asyncHandler(async (req, res) => {
  res
    .status(200)
    .clearCookie('token', options)
    .json(new ApiResponse(200, {}, 'Moderator logged out successfully!'));
});

const getFlaggedProductsAndReviews = asyncHandler(async(req , res) => {
    try {
        const flaggedReviews = await Review.find({isFlagged: true})
        const flaggedProducts = await Product.find({ isFlagged: true });
        return res.status(200).json(
            new ApiResponse(200,{flaggedReviews , flaggedProducts},"Flagged Reviews and Products fetched successfully!")
        )
    } catch (error) {
        throw new ApiError(500,"Something went wrong while getting flagged reviews and products!")
    }
})
  
const approveFlaggedReview = asyncHandler(async (req, res) => {
    const { id: reviewId } = req.params;
  
    try {
      const updatedReview = await Review.findByIdAndUpdate(
        reviewId,
        { 
          approvedByModerator: true,
          isFlagged: false,
        },
        { new: true }
      );
  
      if (!updatedReview) {
        throw new ApiError(404, "Review not found");
      }
  
      return res
        .status(200)
        .json(new ApiResponse(200, { updatedReview }, "Review approved successfully!"));
    } catch (error) {
      throw new ApiError(500, "Something went wrong while approving the review!");
    }
});
  
const dismissFlaggedReview = asyncHandler(async (req, res) => {
    const { id: reviewId } = req.params;
    try {
      const deletedReview = await Review.findByIdAndDelete(reviewId);
      if (!deletedReview) throw new ApiError(404, "Review not found");
  
      const productId = deletedReview.product;
      const reviewRating = deletedReview.rating;
  
      const product = await Product.findByIdAndUpdate(
        productId,
        {
            $pull: { reviews: reviewId }
        },
        { new: true }
      );
  
      if (!product) throw new ApiError(404, "Associated product not found");
  
      const oldAvg = product.ratings.average;
      const oldCount = product.ratings.count;
  
      const newCount = oldCount - 1;
      const newAvg = newCount === 0 ? 5 : (oldAvg * oldCount - reviewRating) / newCount;
  
      product.ratings.average = newAvg;
      product.ratings.count = newCount;

      const userId = product.createdBy;

      await User.findByIdAndUpdate(
        userId,
        [
          {
            $set: {
              trustScore: {
                $max: [{ $subtract: ["$trustScore", 1] }, 0]
              }
            }
          }
        ]
      );
  
      await product.save();
  
      return res.status(200).json(new ApiResponse(200, {}, "Review dismissed successfully!"));
    } catch (error) {
      throw new ApiError(500, "Something went wrong while dismissing the review!");
    }
});

const approveFlaggedProduct = asyncHandler(async (req, res) => {
    const { id: productId } = req.params;
  
    try {
      const updatedProduct = await Product.findByIdAndUpdate(
        productId,
        { 
          approvedByModerator: true,
          isFlagged: false,
        },
        { new: true }
      );
  
      if (!updatedProduct) {
        throw new ApiError(404, "Product not found");
      }
  
      return res.status(200).json(
        new ApiResponse(200, { updatedProduct }, "Flagged product approved successfully!")
      );
    } catch (error) {
      throw new ApiError(500, "Something went wrong while approving the product!");
    }
});

const dismissFlaggedProduct = asyncHandler(async (req, res) => {
  const { id: productId } = req.params;

  try {
      await Review.deleteMany({ product: productId });

      const deletedProduct = await Product.findByIdAndDelete(productId);

      const userId = deletedProduct.createdBy;

      await User.findByIdAndUpdate(userId, {
        $pull: { listedProducts: productId }
      });

      await User.findByIdAndUpdate(
        userId,
        [
          {
            $set: {
              trustScore: {
                $max: [{ $subtract: ["$trustScore", 20] }, 0]
              }
            }
          }
        ]
      );
      
      if (!deletedProduct) {
          throw new ApiError(404, "Product not found");
      }

      return res.status(200).json(
          new ApiResponse(200, {}, "Flagged product and its reviews deleted successfully!")
      );
  } catch (error) {
      throw new ApiError(500, "Something went wrong while dismissing the product!");
  }
});

  
export {
    registerModerator,
    loginModerator,
    logoutModerator,
    getFlaggedProductsAndReviews,
    approveFlaggedReview,
    dismissFlaggedReview,
    approveFlaggedProduct,
    dismissFlaggedProduct,
}