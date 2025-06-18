import  express  from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import connectDB from "./db/index.js";

dotenv.config({
    path: "./backend/.env",
})

const app = express();
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(
  express.json({
    limit: "128kb",
  })
);
app.use(
  express.urlencoded({
    extended: true,
    limit: "128kb",
  })
);
app.use(express.static("public"));
app.use(cookieParser());

//Import routes

//Routes declaration

connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000,()=>{
        console.log(`Server is running at port: ${process.env.PORT}`);
    })
})
.catch((error)=>{
    console.log("MongoDB connection failed! ",error);
})