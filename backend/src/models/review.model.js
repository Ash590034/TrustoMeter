import mongoose,{Schema} from 'mongoose';

const reviewSchema = new Schema(
  {
    user: {
      type: String,
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
      default: false,
    },
    reasons: [
      {type: String},
    ]
  },
  { timestamps: true }
);


export const Review = mongoose.model('Review', reviewSchema);

