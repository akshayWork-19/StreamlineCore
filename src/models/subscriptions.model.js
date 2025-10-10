import mongoose, { Schema, model } from mongoose;

const subscriptionSchema = new Schema({
  subscriber: {
    type: Schema.Types.ObjectId, //one who is subscribing
    ref: "User"
  },
  channel: {
    type: Schema.Types.ObjectId, //one to whom i subscribed
    ref: "User",
  }
}, { timestamps: true });

export const Subscriptions = model("Subscriptions", subscriptionSchema);