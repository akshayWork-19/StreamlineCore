import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { User } from '../models/user.model.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';

import jwt from "jsonwebtoken";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, error.message);
  }
}



const registerUser = asyncHandler(async (req, res) => {
  //get user details from frontend
  //validation-not empty fields
  //check if user already exists:username ,email
  //check for images,check for avatar - its compulsory
  //upload them on server then on cloudinary,check for avatar uploaded successfully
  //create user object - create entry in db
  //remove password and refresh token from response
  //check for user creation if succeded or not 
  //return res


  const { username, email, fullName, password } = req.body;
  console.log(username, email);
  if ([fullName, username, email, password].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All fields are Required!");
  }

  const existedUser = await User.findOne({ $or: [{ username }, { email }] })
  console.log(existedUser);
  if (existedUser) {
    throw new ApiError(409, "User already exists with email!!")
  }

  console.log(req.files);
  const avatarLocalPath = req.files?.avatar[0]?.path;
  // const coverImageLocalPath = req.files?.coverImage[0]?.path;
  let coverImageLocalPath;
  if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required!");
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);


  console.log(avatar);//cloudinary response object
  if (!avatar) {
    throw new ApiError(400, "File isn't uploaded on server/cloudinary");
  }
  const user = await User.create({
    fullName,
    email,
    password,
    avatar: avatar?.url,
    coverImage: coverImage?.url || "",
    username: username.toLowerCase(),
  })
  const userCreated = await User.findById(user._id).select(
    "-password -refreshToken"
  )
  if (!userCreated) {
    throw new ApiError(500, "Something went Wrong Registering the user!");
  }
  return res.status(200).json(new ApiResponse(200, userCreated, "User Registered Successfully!!"));

})


const loginUser = asyncHandler(async (req, res) => {
  //email ,password 
  //validation hit - with password help we'll check ki passwords saved in our db user regarding the email is same or not - if same then get user through else show error 
  //after user is checked create refresh,access token save refreshToken in db,access token to user or attach it with res object so that in later requests we can take that accesstoken value from res object and verify the user without actually hitting db verification calls
  const { username, email, password } = req.body;
  if (!username && !email) {
    throw new ApiError(400, "Username or Email is required!")
  }

  const user = await User.findOne({ $or: [{ username }, { email }] });
  if (!user) {
    throw new ApiError(400, "User doesn't exists");
  }
  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Incorrect Password!!");
  }
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

  const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

  const options = {
    httpOnly: true,
    secure: true
  }

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(200,
        {
          user: loggedInUser
          , accessToken
          , refreshToken
        },
        "user is logged-In successfullly!"
      )
    )
})

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined
      }
    },
    {
      new: true
    }
  )

  const options = {
    httpOnly: true,
    secure: true
  }

  return res.status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, "User logged-out successfully"))
})

const refreshAccessToken = asyncHandler(async (req, res) => {
  try {
    const incomingRefreshToken = req.cookies.refreshToken || req.body().refreshToken;

    if (!incomingRefreshToken) {
      throw new ApiError(401, "Unauthorized Request!!");
    }

    const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);

    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(401, "Unauthorized Request!!");
    }
    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Invalid refreshToken or Expired!")
    }
    const options = {
      httpOnly: true,
      secure: true
    };

    const { newRefreshToken, accessToken } = await generateAccessAndRefreshToken(user._id);
    return res
      .status(200)
      .cookie("refreshToken", newRefreshToken, options)
      .cookie("accessToken", accessToken, options)
      .json(new ApiResponse(200, { accessToken, refreshToken: newRefreshToken }, "Access Tokens refreshed "))
  } catch (error) {
    throw new ApiError(500, "Internal Server Error ::error", error?.message || "Invalid Refresh Token")
  }
})

const updateUser = () => {

}

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const userId = req.user?._id;
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(400, "You need to log-in First!");
  }
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
  if (!isPasswordCorrect) {
    throw new ApiError(401, "Wrong Password Entered!!");
  }
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, "Password updated Successfully!"));
})

const getCurrentUser = asyncHandler(async (req, res) => {
  const user = req.user;
  if (!user) {
    throw new ApiError(400, "User not Logged-In!");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current user fetched Successfully!"));
})

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;
  if (!fullName || !email) {
    throw new ApiError(400, "All fields are required!");
  }
  const userId = req.user?._id;
  const updatedUser = await User.findByIdAndUpdate(userId, {
    $set: {
      fullName: fullName, email: email
    }
  }, {
    new: true
  }).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, updatedUser, "Accounts details updated Successfully!"))
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file missing !");
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  if (!avatar) {
    throw new ApiError(400, "Avatar File Upload issue :: updateUserAvatar !");
  }

  const userId = req.user?._id;
  if (!userId) {
    throw new ApiError(400, "UserId error :: getting user inside update useravatar !");
  }

  const updateUser = await User.findByIdAndUpdate(userId, {
    $set: {
      avatar: avatar?.url
    }
  }, {
    new: true
  }).select("-password ");

  return res
    .status(200)
    .json(new ApiResponse(200, updateUser, "User avatar updated successfully"));

})


const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;
  if (!coverImageLocalPath) {
    throw new ApiError(400, "CoverImage file missing !");
  }
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if (!coverImage) {
    throw new ApiError(400, "Cover Image File Upload issue :: updateUserCoverImage !");
  }

  const userId = req.user?._id;
  if (!userId) {
    throw new ApiError(400, "UserId error :: getting user inside updateUserCoverImage !");
  }

  const updateUser = await User.findByIdAndUpdate(userId, {
    $set: {
      coverImage: coverImage?.url
    }
  }, {
    new: true
  }).select("-password ")

  return res
    .status(200)
    .json(new ApiResponse(200, updateUser, "User coverImage updated successfully"));

})

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  getCurrentUser,
  changeCurrentPassword,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage
}