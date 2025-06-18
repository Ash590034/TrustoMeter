import mongoose , {Schema} from 'mongoose';

const productSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    category: {
      type: String,
      required: true,
    },
    images: [
      {
        url: String,
        alt: String,
      },
    ],
    ratings: {
      average: { 
        type: Number,
        default: 5 
      },
      count: { 
        type: Number, 
        default: 0 
      },
    },
    reviews :[
        {
            type: Schema.Types.ObjectId,
            ref: 'Review',
            required: true,
        },
    ],
    trustScore: {
        type: Number,
        default: 100,
        min: 0,
        max: 100,
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

const Product = mongoose.model('Product', productSchema);
export default Product;
