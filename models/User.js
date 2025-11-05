import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: false, // Not required initially for SSO users
      unique: true,
      sparse: true, // Allows null values to not be unique
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username cannot be more than 30 characters'],
      lowercase: true,
      match: [/^[a-z0-9_-]+$/, 'Username can only contain lowercase letters, numbers, hyphens and underscores'],
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: false, // Not required for SSO users
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Don't return password by default
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
      select: false,
    },
    emailVerificationTokenExpires: {
      type: Date,
      select: false,
    },
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetTokenExpires: {
      type: Date,
      select: false,
    },
    organization: {
      type: String,
      enum: ['BGL IT'],
      default: 'BGL IT',
      required: false, // Not required initially for SSO users
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true, // Allows null values to not be unique
    },
    image: {
      type: String,
    },
    profileComplete: {
      type: Boolean,
      default: false, // Track if SSO user has completed their profile
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
    return;
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (plainPassword) {
  return await bcrypt.compare(plainPassword, this.password);
};

export default mongoose.models.User || mongoose.model('User', userSchema);
