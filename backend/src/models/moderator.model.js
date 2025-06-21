import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";

const moderatorSchema = new Schema(
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
        required: [true, "Password is required!"],
      },
      
    },
    { timestamps: true }
);
  
moderatorSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

moderatorSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
};

export const Moderator = mongoose.model("Moderator", moderatorSchema);
