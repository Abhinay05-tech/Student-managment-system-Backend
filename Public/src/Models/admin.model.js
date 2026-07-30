import mongoose, { Schema } from "mongoose";

const adminSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        unique: true,
        required: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: [true, "Enter your password"],
    },
    role: {
        type: String,
        default: "Admin"
    },
    schoolName: {
        type: String,
        unique: true,
        required: true
    },
    // profileImage: {
    //     type: String,
    //     default: "https://res.cloudinary.com/dxjv8gq3f/image/upload/v1690911680/School%20Management%20System/DefaultProfileImage.png"
    // },
    // refreshToken: {
    //     type: String,
    // },
});

export const admin = mongoose.model("admin", adminSchema);