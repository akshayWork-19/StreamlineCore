import mongoose, { isValidObjectId } from "mongoose"
import Tweet from "../models/tweet.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


// #region createTweet
const createTweet = asyncHandler(async (req, res) => {
  //TODO: create tweet
  const { content } = req.body;
  const userId = req.user?._id;
  if (typeof content !== 'string' || content.trim().length == 0) {
    throw new ApiError(401, "content is invalid or Empty!")
  }

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid userId format!");
  }

  const tweet = await Tweet.create({
    owner: userId,
    content: content.trim() || ""
  });
  if (!tweet) {
    throw new ApiError(500, "Tweet failed to create in the database.:: CreateTweet");
  }
  return res.status(201).json(new ApiResponse(200, { tweetCreated: tweet }, "Tweet created Successfully"))
})

// #region getUserTweets

const getUserTweets = asyncHandler(async (req, res) => {
  // TODO: get user tweets
  const userId = req.user?._id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  if (!userId) {
    throw new ApiError(400, "Log-in First!");
  }
  const totalTweets = await Tweet.countDocuments({ owner: userId });
  const tweets = await Tweet.find({ owner: userId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)

  return res.status(200).json(new ApiResponse(200, {
    userTweets: tweets,
    totalTweets: totalTweets,
    totalPages: Math.ceil(totalTweets / limit),
    currentPage: page,
    limit: limit
  }, "Tweets fetched Successfully"))
})

// #region updateTweet

const updateTweet = asyncHandler(async (req, res) => {
  //TODO: update tweet
  const { tweetId } = req.params;
  const { content } = req.body;
  const userId = req.user?._id;
  if (!tweetId || !mongoose.Types.ObjectId.isValid(tweetId)) {
    throw new ApiError(401, "tweetId invalid format");
  }
  if (!content || content.trim().length === 0) {
    throw new ApiError(401, "Content invalid or Empty");
  }

  const existingTweet = await Tweet.findById(tweetId);
  if (!existingTweet) {
    throw new ApiError(404, "Tweet not found.");
  }

  //check ownership
  if (existingTweet.owner.toString() !== userId.toString()) {
    throw new ApiError(403, "Forbidden: You are not the owner of this tweet.")
  }

  const tweet = await Tweet.findByIdAndUpdate(
    tweetId,
    {
      $set: { content: content.trim() || content }
    },
    { new: true }
  )
  if (!tweet) {
    throw new ApiError(500, "Internal Server Error :: Tweet updation failed!");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, { updatedTweet: tweet }, "Tweet updated Sucessfully"));

})

// #region deleteTweet

const deleteTweet = asyncHandler(async (req, res) => {
  //TODO: delete tweet
  const { tweetId } = req.params;
  if (!tweetId || !mongoose.Types.ObjectId.isValid(tweetId)) {
    throw new ApiError(400, "Invalid tweetId format");
  }
  const userId = req.user?._id;

  const existingTweet = await Tweet.findById(tweetId);
  if (!existingTweet) {
    throw new ApiError(404, "Tweet not found.");
  }

  //check ownership
  if (existingTweet.owner.toString() !== userId.toString()) {
    throw new ApiError(403, "Forbidden: You are not the owner of this tweet.")
  }

  const tweet = await Tweet.findByIdAndDelete(tweetId);
  if (!tweet) {
    throw new ApiError(500, "Internal Server Error :: Deletion failed!")
  }
  return res
    .status(200)
    .json(new ApiResponse(200, { tweetDeleted: tweet }, "Tweet deleted successfully!"));
})

export {
  createTweet,
  getUserTweets,
  updateTweet,
  deleteTweet
}