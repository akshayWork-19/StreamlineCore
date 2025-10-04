import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { User } from '../models/user.model.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';


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

export {
  registerUser
}