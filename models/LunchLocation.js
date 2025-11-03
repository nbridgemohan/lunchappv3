import mongoose from 'mongoose';

const lunchLocationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a location name'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    votes: {
      type: Number,
      default: 0,
    },
    voters: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.LunchLocation || mongoose.model('LunchLocation', lunchLocationSchema);
