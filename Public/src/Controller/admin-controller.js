import { asynchandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { Admin } from "../models/admin.model.js";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";

// const Admin = require('../models/adminSchema.js');
// const Sclass = require('../models/sclassSchema.js');
// const Student = require('../models/studentSchema.js');
// const Teacher = require('../models/teacherSchema.js');
// const Subject = require('../models/subjectSchema.js');
// const Notice = require('../models/noticeSchema.js');
// const Complain = require('../models/complainSchema.js');

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



// const adminRegister = async ( req, res) => {
//     try {
//         const admin = new Admin({
//             ...req.body
//         });

//         const existingAdminByEmail = await Admin.findOne({ email: req.body.email });
//         const existingSchool = await Admin.findOne({ schoolName: req.body.schoolName });

//         if (existingAdminByEmail) {
//             res.send({ message: 'Email already exists' });
//         }
//         else if (existingSchool) {
//             res.send({ message: 'School name already exists' });
//         }
//         else {
//             let result = await admin.save();
//             result.password = undefined;
//             res.send(result);
//         }
//     } catch (err) {
//         res.status(500).json(err);
//     }
// };

// const adminLogIn = async (req, res) => {
//     if (req.body.email && req.body.password) {
//         let admin = await Admin.findOne({ email: req.body.email });
//         if (admin) {
//             if (req.body.password === admin.password) {
//                 admin.password = undefined;
//                 res.send(admin);
//             } else {
//                 res.send({ message: "Invalid password" });
//             }
//         } else {
//             res.send({ message: "User not found" });
//         }
//     } else {
//         res.send({ message: "Email and password are required" });
//     }
// };

const getAdminDetail = async (req, res) => {
    try {
        let admin = await Admin.findById(req.params.id);
        if (admin) {
            admin.password = undefined;
            res.send(admin);
        }
        else {
            res.send({ message: "No admin found" });
        }
    } catch (err) {
        res.status(500).json(err);
    }
}

// const deleteAdmin = async (req, res) => {
//     try {
//         const result = await Admin.findByIdAndDelete(req.params.id)

//         await Sclass.deleteMany({ school: req.params.id });
//         await Student.deleteMany({ school: req.params.id });
//         await Teacher.deleteMany({ school: req.params.id });
//         await Subject.deleteMany({ school: req.params.id });
//         await Notice.deleteMany({ school: req.params.id });
//         await Complain.deleteMany({ school: req.params.id });

//         res.send(result)
//     } catch (error) {
//         res.status(500).json(err);
//     }
// }

// const updateAdmin = async (req, res) => {
//     try {
//         if (req.body.password) {
//             const salt = await bcrypt.genSalt(10)
//             res.body.password = await bcrypt.hash(res.body.password, salt)
//         }
//         let result = await Admin.findByIdAndUpdate(req.params.id,
//             { $set: req.body },
//             { new: true })

//         result.password = undefined;
//         res.send(result)
//     } catch (error) {
//         res.status(500).json(err);
//     }
// }

// module.exports = { adminRegister, adminLogIn, getAdminDetail, deleteAdmin, updateAdmin };

module.exports = { adminRegister, adminLogIn, getAdminDetail };
