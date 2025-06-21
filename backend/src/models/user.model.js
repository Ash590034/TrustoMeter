import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new Schema(
    {
      email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
      },
      fullName: {
        type: String,
        required: true,
        trim: true,
      },
      password: {
        type: String,
        required: true,
      },
      listedProducts :[
        {
            type: Schema.Types.ObjectId,
            ref: 'Product',
        },
      ],
      trustScore: {
        type: Number,
        default: 100,
        min: 0,
        max: 100,
      },
      trustBadge: {
        type: String,
        default: "A"
      },
      flaggedProducts: {
        type: Number,
        default: 0
      }
    },
    { timestamps: true }
);
  
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
};

export const User = mongoose.model("User", userSchema);