import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import jwt from 'jsonwebtoken';

export async function POST(request) {
  try {
    await dbConnect();
    const { username, password } = await request.json();

    // Validation
    if (!username || !password) {
      return Response.json(
        { success: false, error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Find user by username (case-insensitive)
    const user = await User.findOne({ username: username.toLowerCase() }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return Response.json(
        { success: false, error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      return Response.json(
        { success: false, error: 'Please verify your email before logging in', needsVerification: true },
        { status: 403 }
      );
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      { expiresIn: '7d' }
    );

    console.log('User logged in:', user._id);

    return Response.json({
      success: true,
      message: 'Login successful',
      data: {
        userId: user._id,
        username: user.username,
        email: user.email,
        token,
      },
    });
  } catch (error) {
    console.error('POST /api/auth/login error:', error);
    return Response.json(
      { success: false, error: error.message || 'Login failed' },
      { status: 400 }
    );
  }
}
