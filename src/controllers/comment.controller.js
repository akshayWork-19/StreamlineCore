import mongoose, { Schema } from "mongoose"
import Comment from "../models/comment.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

// #region getVideoComments

const getVideoComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  try {
    const { videoId } = req.params
    // const { page = 1, limit = 10 } = req.query
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
      throw new ApiError(400, "Invalid VideoId");
    }

    const totalComments = await Comment.countDocuments({ video: videoId });
    const comments = await Comment.find({
      video: videoId,
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    /*
    -------Unnessecary because retrieval will still return empty array no falsy values
     if (!comments) {
       throw new ApiError(500, "Error While fetching Comments");
     }
     */

    return res
      .status(200)
      .json(new ApiResponse(200,
        {
          comments: comments,
          totalComments: totalComments,
          totalPages: Math.ceil(totalComments / limit),
          currentPage: page,
          limit: limit
        },
        "Comments Fetched Successfully!"));
  } catch (error) {
    throw new ApiError(500, "Internal Server Error ::error :: getVideoComments:", error.message);
  }
})

// #region addComment

const addComment = asyncHandler(async (req, res) => {
  // TODO: add a comment to a video
  const { content } = req.body;
  const { videoId } = req.params;
  const userId = req.user?._id;
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid Id format for userId");
  }
  if (typeof content !== 'string' || content.trim().length == 0) {
    throw new ApiError(400, "Comment cannot be empty!");
  }
  if (!videoId || !mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "VideoId is either Invalid or Empty!");
  }
  const newComment = await Comment.create({
    owner: userId,
    content: content.trim(),
    video: videoId
  })
  if (!newComment) {
    throw new ApiError(500, "Comment failed to be created in the database.");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, newComment, "Comment created Successfully"));
})

// #region updateComment

const updateComment = asyncHandler(async (req, res) => {
  // TODO: update a comment
  const { content } = req.body;
  const { commentId } = req.params;
  const userId = req.user?._id;
  if (!commentId || !mongoose.Types.ObjectId.isValid(commentId)) {
    throw new ApiError(400, "CommentId is either empty or Invalid!")
  }
  if (typeof content !== 'string' || content.trim().length == 0) {
    throw new ApiError(400, "Comment cannot be empty!");
  }
  if (!userId) {
    throw new ApiError(401, "Unauthorized.Please log in!");
  }

  //security check 
  const existingComment = await Comment.findById(commentId);
  if (!existingComment) {
    throw new ApiError(404, "Comment not found.")
  }
  if (existingComment.owner.toString() !== userId.toString()) {
    throw new ApiError(403, "Forbidden: You are not the owner of this tweet.")
  }

  const comment = await Comment.findByIdAndUpdate(
    commentId,
    {
      $set: { content: content.trim() || content, }
    },
    { new: true });
  if (!comment) {
    throw new ApiError(401, "Comment doesn't exist,Create before updation!");
  }
  return res
    .status(200)
    .json(new ApiResponse(200,
      {
        updatedComment: comment
      }
      , "Comment updated Successfully!"
    ));
})

// #region deleteComment

const deleteComment = asyncHandler(async (req, res) => {
  // TODO: delete a comment
  const { commentId } = req.params;
  const userId = req.user?._id;
  if (!commentId || !mongoose.Types.ObjectId.isValid(commentId)) {
    throw new ApiError(400, "Invalid format for commentId");
  }
  const existingComment = await Comment.findById(commentId);
  if (!existingComment) {
    throw new ApiError(404, "Comment not found.");
  }
  if (existingComment.owner.toString() !== userId.toString()) {
    throw new ApiError(403, "Forbidden: You are not the owner of this tweet.");
  }

  const comment = await Comment.findByIdAndDelete(commentId);
  if (!comment) {
    throw new ApiError(500, "Server Error: Deletion Of Comment!");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment Deleted Successfully"));

})

export {
  getVideoComments,
  addComment,
  updateComment,
  deleteComment
}