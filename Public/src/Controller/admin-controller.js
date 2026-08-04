import { asynchandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { Admin } from "../models/admin.model.js";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";


const generatejwtToken = async (adminId) => {
    try{
        const admin = await admin.findById(adminId);
        const accessToken = admin.generatejwtToken()
        const refreshToken = admin.generateRefreshToken()

        admin.refreshToken = refreshToken;
        await admin.save ({ validationBeforeSave: false})

        return { accessToken, refreshToken }

    } catch (error) {
        throw new ApiError(500, "Error generating JWT token")
    }
}

const adminRegister = asynchandler (async (req, res) => {
    //  get user deatails from request body
    const { name, email, password, schoolName } = req.body

    // check if all fields are provided
    if (!name || !email || !password || !schoolName) {
        throw new ApiError(400, "All fields are required")
    }

    // check if user already exists
    const existedadmin = await admin.findOne({
        $or: [{ email }, { schoolName }]
    })

    if (existedadmin) {
        throw new ApiError(400, "email or school name already exists")
    }

    // create new user in DB
    const admin = await admin.create({
        name,
        email,
        password,
        schoolName
    })

    const createdadmin = await admin.findById(admin._id).select(
        "-password -refreshToken"
    )

    if ( !createdadmin) {
        throw new ApiError(500, "Failed to create admin")
    }

    return res.status(201).json(new ApiResponse(201, "Admin created successfully", createdadmin))

})

const loginadmin = asynchandler ( async (req, res) =>{
    //   req body data
    // validation username and password
    // check if user exists, email or school name
    // check if password is correct
    // generate token
    // send cookies

    const { email, schoolName, password } = req.body

    if (!email && !schoolName) {
        throw new ApiError(400, "Email or school name is required")
    }    

    const ispasswordvalid = await admin.ispasswordcorrect(password)

    if ( !ispasswordvalid) {
        throw new ApiError(400, "Invalid password")
    }

    const { accessToken, refreshToken } = await generatejwtToken(admin._id)

     const loggedInUser = await admin.findById(admin._id).select("-password -refreshToken")

     const options = {
        httpOnly: true,
        secure: true,
     }

     return res
     .status(200)
     .cookie("accessToken", accessToken, options)
     .cookie("refreshToken", refreshToken, options)
     .json(new ApiResponse(200, "Admin logged in successfully", loggedInUser))
})

const logoutadmin = asynchandler ( async (req, res) => {
    await admin.findByIdAndUpdate (req.admin._id, { refreshToken: 1 }, { new: true })

    const options = {
        httpOnly: true,
        secure: true,
    }

    return res
    .status(200)
    .clearcookie ( "accessToken", options )
    .clearcookie ( "refreshToken", options )
    .json(new ApiResponse(200, "Admin logged out successfully",))
})

const refreshAccessToken = asynchandler ( async ( req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if( !incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.JWT_REFRESH_SECRET)

        if (!admin) {
            throw new ApiError(401, "unauthorized request")
        }
        if (incomingRefreshToken !== admin.refreshToken) {
            throw new ApiError(401, "Refresh token is expired")
        }

        const { accessToken, newRefreshToken } = await generateAccessAndRefreshToken(admin._id)

        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(new ApiResponse(200, "Access token refreshed successfully", { accessToken, newRefreshToken }))
    }  
       catch (error) {
        throw new ApiError(401, "Invalid refresh token")
    }

});

const changeCurrentPassword = asyncHandler(async(req, res) => {
    const {oldPassword, newPassword} = req.body

    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

     if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password")
    }

    user.password = newPassword
    await user.save({validateBeforeSave: false}) 

     return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"))
})

const getCurrentUser = asyncHandler(async(req, res) => {
    return res
    .status(200)
    .json(new ApiResponse(
        200,
        req.user,
        "User fetched successfully"
    ))
})


const updateAccountDetails = asyncHandler(async(req, res) => {
    const {fullName, email} = req.body

    if (!fullName || !email) {
        throw new ApiError(400, "All fields are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email: email
            }
        },
        {new: true}
        
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"))
})




export {
    adminRegister,
    loginadmin,
    logoutadmin,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails
}