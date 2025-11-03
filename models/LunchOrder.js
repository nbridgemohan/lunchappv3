import mongoose from 'mongoose';

const lunchOrderSchema = new mongoose.Schema(
  {
    locationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LunchLocation',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    item: {
      type: String,
      required: [true, 'Please provide what you want to order'],
      trim: true,
    },
    cost: {
      type: Number,
      required: [true, 'Please provide the cost'],
      min: [0, 'Cost cannot be negative'],
    },
    notes: {
      type: String,
      trim: true,
    },
    orderDate: {
      type: Date,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.LunchOrder || mongoose.model('LunchOrder', lunchOrderSchema);
