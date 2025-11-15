import mongoose, { isValidObjectId, mongo } from "mongoose"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { Subscriptions } from "../models/subscriptions.model.js"

const toggleSubscription = asyncHandler(async (req, res) => {
  // TODO: toggle subscription
  const { channelId } = req.params;
  const userId = req.user._id;

  if (!mongoose.isValidObjectId(channelId)) {
    throw new ApiError(401, "Invalid channelId!");
  }
  let response;
  const subsriptionFilter = {
    subscriber: userId,
    channel: channelId,
  }
  const isSub = await Subscriptions.findOne(subsriptionFilter);
  if (isSub) {
    await Subscriptions.deleteOne(subsriptionFilter);
    response = new ApiResponse(200, "Unsubscribed Successfully");
  } else {
    await Subscriptions.create(subsriptionFilter);
    response = new ApiResponse(200, "Subscribed Successfully");
  }
  return res.status(200).json(response);
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params
  if (!mongoose.isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid Channel-Id");
  }
  const subscriberList = await Subscriptions.aggregate([
    {
      $match: {
        channel: new mongoose.Types.ObjectId(channelId)
      }
    },
    {
      // 2. Join: Bring in the subscriber's user details
      $lookup: {
        from: "users", // The collection name for your 'User' model (usually lowercase and plural)
        localField: "subscriber",
        foreignField: "_id",
        as: "subscriberDetails"
      }
    },
    {
      $unwind: "$subscriberDetails"
    },
    {
      $project: {
        _id: 0,
        subscribeId: "subscriberDetails._id",
        username: "subscriberDetails.username",
        fullName: "subscriberDetails.fullName",
        avatar: "subscriberDetails.avatar",
        subscribedAt: "$createdAt"
      }
    }
  ])

  return res.status(200).json(new ApiResponse(200, { subscribers: subscriberList }, "Subscriber Fetched Successfully!"))
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params

  if (!mongoose.isValidObjectId(subscriberId) || (req.user._id !== subscriberId)) {
    throw new ApiError(400, "Invalid User Request");
  }

  const channels = await Subscriptions.aggregate([
    {
      $match: {
        subscriber: new mongoose.Types.ObjectId(subscriberId)
      }
    },
    {
      // 2. Join: Bring in the subscriber's user details
      $lookup: {
        from: "users", // The collection name for your 'User' model (usually lowercase and plural)
        localField: "channel",
        foreignField: "_id",
        as: "channelDetails"
      }
    },
    {
      $unwind: "$channelDetails"
    },
    {
      $project: {
        _id: 0,
        subscribeId: "channelDetails._id",
        username: "channelDetails.username",
        fullName: "channelDetails.fullName",
        avatar: "channelDetails.avatar",
        subscribedAt: "$createdAt"
      }
    }
  ])
  return res.status(200).json(200, { channelsList: channels }, "Channels Fetched Successfully")

})

export {
  toggleSubscription,
  getUserChannelSubscribers,
  getSubscribedChannels
}