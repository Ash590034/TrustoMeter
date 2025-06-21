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
      },
    ],
    ratings: {
      average: { 
        type: Number,
        default: 5,
        min: 0,
        max: 5
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
        },
    ],
    analysis: {
      trustScore: {
        type: Number,
        min: 0,
        max: 100,
        default: null,
      },
      summary: {
        type: String,
      },
      redFlags: [String],
      verification: {
        descriptionCheck: {
          isConsistent: Boolean,
          quality: {
            type: String,
            enum: ['Good', 'Average', 'Poor', 'Unknown'],
          },
          findings: String,
        },
        priceCheck: {
          status: {
            type: String,
            enum: ['Reasonable', 'Slightly Off', 'Too Low', 'Too High', 'Unknown'],
          },
          findings: String,
        },
        imageCheck: {
          authenticity: {
            type: String,
            enum: ['Authentic', 'Stock Photo', 'Suspicious', 'No Images', 'Unknown'],
          },
          findings: String,
        },
        sellerCheck: {
          status: {
            type: String,
            enum: ['Reputable', 'Generic', 'Unknown', 'Suspicious'],
          },
          findings: String,
        },
        brandCheck: {
          status: {
            type: String,
            enum: ['Present', 'Unverified', 'Missing'],
          },
          findings: String,
        }
      },
      analyzedAt: {
        type: Date,
      }
    },
    isFlagged: {
      type: Boolean,
      default: false,
    },
    approvedByModerator: {
      type: Boolean,
      default: false,
    }
  },
  { timestamps: true }
);

export const Product = mongoose.model('Product', productSchema);

