import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import  {User}  from "../models/user.model.js";
import {Product}  from "../models/product.model.js";
import {Review} from "../models/review.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import { analyzeReview } from '../utils/reviewAnalysis.js';
import { analyzeProduct } from '../utils/productAnalysis.js';

const options = {
    httpOnly: true,
    secure: true,
    sameSite: "lax"
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
        process.env.JWT_SECRET,
      );
  
      return { token };
    } catch (error) {
      throw new ApiError(500, "Something went wrong while generating tokens!");
    }
};
  
const register = asyncHandler(async (req, res) => {
    try {
      const { fullName, email, password } = req.body;
  
      if (!email || !password || !fullName) {
        throw new ApiError(400, "All fields are required.");
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

      const { token } = await generateToken(user._id);
  
      return res
        .status(201)
        .cookie("token", token, options)
        .json(new ApiResponse(201,{ user:userObj }, "User registered successfully"));
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
      .cookie("token", "", { ...options, maxAge: 0 })
      .json(new ApiResponse(200, {}, "User logged out successfully!"));
});

const getProducts = asyncHandler(async (req, res) => {
  try {
    const products = await Product.find()
      .populate({
        path: 'reviews',
        select: 'rating comment createdAt user',
        populate: {
          path: 'user',
          select: 'fullName'
        }
    });

    return res.status(200).json(
      new ApiResponse(200, { products }, "Products fetched successfully!")
    );
  } catch (error) {
    throw new ApiError(500, "Something went wrong while getting products list!");
  }
});

const getProductsByCategory = asyncHandler(async (req, res) => {
  const { id: category } = req.params;

  try {
    const products = await Product.find({ category });

    res.status(200).json(
      new ApiResponse(200, { products }, `${category}s fetched successfully!`)
    );
  } catch (error) {
    throw new ApiError(500, `Something went wrong while getting ${category} list!`);
  }
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
    const user = req.user;
  
    try {
      const product = await Product.findById(productId);
      if (!product) {
        throw new ApiError(404, "Product not found");
      }
      
      const productCategory = product.category;

      const alreadyReviewed = await Review.findOne({ product: productId, user: user.fullName });
      if (alreadyReviewed) {
        throw new ApiError(400, "You have already reviewed this product");
      }
      
      const analysis = await analyzeReview(comment, { productCategory, rating });

      const newReview = await Review.create({
        user: user.fullName,
        product: productId,
        rating,
        comment,
        isFlagged:analysis.isFake,
        trustScore: analysis.confidence,
        reasons: analysis.reasons,
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

const addProduct = asyncHandler(async (req, res) => {
  const { name, description, price, category, images } = req.body;
  const user = req.user;

  if (!name || !description || !price || !category) {
    throw new ApiError(400, "Name, description, price and category are mandatory fields!");
  }

  try {
    const product = await Product.create({
      createdBy: user._id,
      name,
      price,
      description,
      category,
      images
    });

    const analysis = await analyzeProduct(product);
    product.analysis = analysis;

    if(analysis.trustScore < 40){
      product.isFlagged = true
    }
    
    await product.save();
    
    await User.findByIdAndUpdate(
      user._id,
      { $push: { listedProducts: product._id } },
      { new: true }
    );

    res.status(200).json(
      new ApiResponse(200, { product }, "Product added successfully!")
    );
  } catch (error) {
    throw new ApiError(500, "Something went wrong while adding the product!");
  }
});

const getAllReviewsForProduct = asyncHandler(async(req,res) => {
  const { id:productId } = req.params;
  try {
    const product = await Product.findById(productId);
    if (!product) {
      throw new ApiError(404, "Product not found");
    }

    const reviews = await Review.find({product:productId})

    return res.status(201).json(
      new ApiResponse(201, { reviews }, "Reviews fetched successfully!")
    );
  } catch (error) {
    throw new ApiError(500, "Something went wrong while fetching the reviews");
  }
});

const getSellerByProductId = asyncHandler(async(req,res) => {
  try {
    const {id:productId} = req.params;
  
    const product = await Product.findById(productId);
  
    if(!product) throw new ApiError(404,"Product not found!");
  
    const sellerId = product.createdBy;
  
    const seller = await User.findById(sellerId).select("-password");
  
    if(!seller) throw new ApiError(404,"Seller not found!");
  
    return res
    .status(200)
    .json(new ApiResponse(200, { seller }, "Seller fetched successfully!"));
  } catch (error) {
    throw new ApiError(500,"Something went wrong while fetching the seller!");
  }

})
  

export {
    generateToken,
    register,
    login,
    logout,
    getCurrentUser,
    getUserById,
    getProducts,
    getProductsByCategory,
    addReview,
    getAllReviewsForProduct,
    addProduct,
    getSellerByProductId,
}