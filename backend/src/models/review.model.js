import mongoose,{Schema} from 'mongoose';

const reviewSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      trim: true,
      required: true,
    },
    trustScore: {
        type: Number,
        default: 100,
    },
    isFlagged: {
      type: Boolean,
      default: false,
    },
    approvedByModerator: {
      type: Boolean,
      default: 0,
    }
  },
  { timestamps: true }
);


const Review = mongoose.model('Review', reviewSchema);
export default Review;
