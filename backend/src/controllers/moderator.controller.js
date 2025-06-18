import { Product } from "../models/product.model";
import { Moderator } from "../models/moderator.model";
import { Review } from "../models/review.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const getFlaggedReviews = asyncHandler(async(req , res) => {
    try {
        const flaggedReviews = await Review.find({isFlagged: true})
        return res.status(200).json(
            new ApiResponse(200,{flaggedReviews},"Flagged Reviews fetched successfully!")
        )
    } catch (error) {
        throw new ApiError(500,"Something went wrong while getting flagged reviews!")
    }
})

const getFlaggedProducts = asyncHandler(async (req, res) => {
    try {
      const flaggedProducts = await Product.find({ isFlagged: true });
  
      return res.status(200).json(
        new ApiResponse(200, { flaggedProducts }, "Flagged products fetched successfully!")
      );
    } catch (error) {
      throw new ApiError(500, "Something went wrong while getting flagged products!");
    }
});
  
const approveFlaggedReview = asyncHandler(async (req, res) => {
    const { id: reviewId } = req.params;
  
    try {
      const updatedReview = await Review.findByIdAndUpdate(
        reviewId,
        { approvedByModerator: true },
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
        { approvedByModerator: true },
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
    getFlaggedReviews,
    getFlaggedProducts,
    approveFlaggedReview,
    dismissFlaggedReview,
    approveFlaggedProduct,
    dismissFlaggedProduct,
}