import { Schema, model } from "mongoose";

const likeSchema = new Schema({
  video: {
    type: Schema.Types.ObjectId,
    ref: "Videos"
  },
  comment: {
    type: Schema.Types.ObjectId,
    ref: "Comment"
  },
  tweet: { //community post 
    type: Schema.Types.ObjectId,
    ref: "Tweet"
  },
  likedBy: {
    type: Schema.Types.ObjectId,
    ref: "User"
  },

}, { timestamps: true });

const Like = new model("Like", likeSchema);
export default Like;