import { Product }  from "../models/product.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const getProducts = asyncHandler(async (req, res) => {
    try {
      const products = await Product.find();
  
      return res.status(200).json(
        new ApiResponse(200, { products }, "Products fetched successfully!")
      );
    } catch (error) {
      throw new ApiError(500, "Something went wrong while getting products list!");
    }
});
  
const getProductsByCategory = asyncHandler(async (req, res) => {
    const { category } = req.params;
  
    try {
      const products = await Product.find({ category });
  
      res.status(200).json(
        new ApiResponse(200, { products }, `${category}s fetched successfully!`)
      );
    } catch (error) {
      throw new ApiError(500, `Something went wrong while getting ${category} list!`);
    }
});

export {
    getProducts,
    getProductsByCategory,
}
