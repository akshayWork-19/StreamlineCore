import { Schema, model } from "mongoose";


const playlistSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  videos: [
    {
      type: Schema.Types.ObjectId,
      ref: "Videos"
    }
  ],
  description: {
    type: String,
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: "User"
  }
}, {
  timestamps: true
});

const Playlist = new model("Playlist", playlistSchema);
export default Playlist;