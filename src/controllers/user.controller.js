import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { User } from '../models/user.model.js';
import { deleteAssest, uploadOnCloudinary } from '../utils/cloudinary.js';
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

// #region register

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

// #region login

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

// #region logOutUser

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      // $unset: {
      //   refreshToken: 1
      // }
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
    .json(new ApiResponse(200, {}, "User logged-out successfully"))
})

// #region refreshAccessTokens

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

//#region changeCurrentPassword
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

// #region getCurrentUser
const getCurrentUser = asyncHandler(async (req, res) => {
  const user = req.user;
  if (!user) {
    throw new ApiError(400, "User not Logged-In!");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current user fetched Successfully!"));
})

// #region updateAccountDetails

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

//#region updateUserAvatar

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

  const user = await User.findById(req.user?._id);
  if (!user) {
    throw new ApiError("Log-in first to complete upload!!");
  }
  const oldAvatarUrl = user.avatar;
  const fileDeleted = await deleteAssest(oldAvatarUrl);
  if (fileDeleted == null) {
    throw new ApiError(500, "Error while deleting Old Asset :: Avatar");
  } else {
    console.log("Old avatar is deleted Successfully!")
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updateUser, "User avatar updated successfully"));

})

// #region updateUserCoverImage

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


  const user = await User.findById(req.user?._id);
  if (!user) {
    throw new ApiError("Log-in first to complete upload!!");
  }
  const oldCoverImageUrl = user.coverImage;
  const fileDeleted = await deleteAssest(oldCoverImageUrl);
  if (fileDeleted == null) {
    throw new ApiError(500, "Error while deleting Old Asset :: coverImage");
  } else {
    console.log("Old avatar is deleted Successfully!");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updateUser, "User coverImage updated successfully"));
})

//#region getUserChannelProfile

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;

  if (!username?.trim()) {
    throw new ApiError(400, "Username is missing :: channelProfile");
  }
  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase()
      }
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers"
      }
    },
    {
      $lookup: {
        from: "channels",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo"
      }
    },
    {
      $addFields: {
        subcribersCount: {
          $size: "$subscribers"
        },
        channelSubscribedToCount: {
          $size: "$subscribedTo"
        },
        isSubscribedTo: {
          $cond: {
            if: { $in: [req.user._id, "$subscribers.subscriber"] },
            then: true,
            else: false
          }
        }
      }
    },
    {
      $project: {
        fullName: 1,
        username: 1,
        email: 1,
        avatar: 1,
        coverImage: 1,
        isSubscribedTo: 1,
        channelSubscribedToCount: 1,
        subcribersCount: 1

      }
    }
  ])

  console.log(channel);
  if (!channel?.length) {
    throw new ApiError(400, "Channel Doesn't exist");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, channel[0], "User Details fetched Successfully"))

});

//#region getUserWatchHistory
const getUserWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id)
      }
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        //Without the nested $lookup, the video documents in your watchHistory would only contain the owner's ID, which is not useful for presentation. The nested lookup transforms that ID into a rich profile object.
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    avatar: 1,
                    username: 1
                  }
                }
              ]
            },
          },
          //we're here editing the datastructure of owner field 
          {
            $addFields: {
              owner: {
                $first: "$owner"
              }
            }
          }
        ]
      }
    }
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, user[0].watchHistory, "User watch history fetched Successfully"))
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
  updateUserCoverImage,
  getUserChannelProfile,
  getUserWatchHistory

}