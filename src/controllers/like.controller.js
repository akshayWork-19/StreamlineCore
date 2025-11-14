import mongoose, { isValidObjectId } from "mongoose"
import Like from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import Video from "../models/video.model.js";
import Comment from "../models/comment.model.js"
import Tweet from "../models/tweet.model.js";
import { User } from "../models/user.model.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params
  //TODO: toggle like on video
  const userId = req.user?._id;

  if (!mongoose.isValidObjectId(userId) || !mongoose.isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid userId or videoId!")
  }


  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found!");
  }

  const likeCondition = {
    video: videoId,
    likedBy: userId
  }
  const exisitingLike = await Like.findOne(likeCondition);

  let isLiked = false;
  let likeCount = 0;
  let responseMessage = "";

  if (exisitingLike) {
    await Like.deleteOne(likeCondition);
    isLiked = false;
    responseMessage = "Video unliked Successfully"
  } else {
    await Like.create({
      video: videoId,
      likedBy: userId,
    });
    isLiked = true;
    responseMessage = "Video liked Successfully"
  }

  likeCount = await Like.countDocuments({ video: videoId });

  return res.status(200).json(new ApiResponse(200, { likeCount, isLiked }, responseMessage));

})

const toggleCommentLike = asyncHandler(async (req, res) => {
  //TODO: toggle like on comment

  const { commentId } = req.params
  const userId = req.user?._id;

  if (!mongoose.isValidObjectId(userId) || !mongoose.isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid userId or CommentId!")
  }


  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new ApiError(404, "Comment not found!");
  }

  const likeCondition = {
    comment: commentId,
    likedBy: userId
  }
  const exisitingLike = await Like.findOne(likeCondition);

  let isLiked = false;
  let likeCount = 0;
  let responseMessage = "";

  if (exisitingLike) {
    await Like.deleteOne(likeCondition);
    isLiked = false;
    responseMessage = "Comment unliked Successfully"
  } else {
    await Like.create({
      comment: commentId,
      likedBy: userId,
    });
    isLiked = true;
    responseMessage = "Comment liked Successfully"
  }

  likeCount = await Like.countDocuments({ comment: commentId });

  return res.status(200).json(new ApiResponse(200, { likeCount, isLiked }, responseMessage));

})

const toggleTweetLike = asyncHandler(async (req, res) => {
  //TODO: toggle like on tweet
  const { tweetId } = req.params
  const userId = req.user?._id;

  if (!mongoose.isValidObjectId(userId) || !mongoose.isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid userId or TweetId!")
  }


  const tweet = await Tweet.findById(tweetId);
  if (!tweet) {
    throw new ApiError(404, "Tweet not found!");
  }

  const likeCondition = {
    tweet: tweetId,
    likedBy: userId
  }
  const exisitingLike = await Like.findOne(likeCondition);

  let isLiked = false;
  let likeCount = 0;
  let responseMessage = "";

  if (exisitingLike) {
    await Like.deleteOne(likeCondition);
    isLiked = false;
    responseMessage = "Tweet unliked Successfully"
  } else {
    await Like.create({
      tweet: tweetId,
      likedBy: userId,
    });
    isLiked = true;
    responseMessage = "Tweet liked Successfully"
  }

  likeCount = await Like.countDocuments({ tweet: tweetId });

  return res.status(200).json(new ApiResponse(200, { likeCount, isLiked }, responseMessage));


}
)

const getLikedVideos = asyncHandler(async (req, res) => {
  //TODO: get all liked videos
  const userId = req.user?._id;

  if (!mongoose.isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid userId");
  }


  const likes = await Like.aggregate([
    {
      $match: {
        likedBy: new mongoose.Types.ObjectId(userId),
        video: { $exists: true, $ne: null }
      }
    },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "videoDetails",

        pipeline: [
          {
            $match: {
              isPublished: true
            }
          },
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  project: {
                    fullName: 1,
                    avatar: 1,
                    username: 1
                  }
                }
              ]
            }
          },
          {
            $addFields: {
              owner: {
                $first: "$owner"
              }
            }
          }
        ]
      }
    },
    {
      $unwind: "$videoDetails"
    },
    {
      $replaceRoot: {
        newRoot: "$videoDetails"
      }
    },
    {
      $project: {
        _id: 1,
        videoFile: 1,
        thumbnail: 1,
        title: 1,
        description: 1,
        duration: 1,
        views: 1,
        owner: 1,
        createdAt: 1,
      }
    }
  ])

  return res.status(200).json(200, likes, "Liked video fetched Successfully");


})

export {
  toggleCommentLike,
  toggleTweetLike,
  toggleVideoLike,
  getLikedVideos
}