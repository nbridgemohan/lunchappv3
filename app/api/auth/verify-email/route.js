import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(request) {
  try {
    await dbConnect();
    const { email, token } = await request.json();

    if (!email || !token) {
      return Response.json(
        { success: false, error: 'Email and token are required' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await User.findOne({
      email: email.toLowerCase(),
      emailVerificationToken: token,
      emailVerificationTokenExpires: { $gt: new Date() },
    });

    if (!user) {
      return Response.json(
        { success: false, error: 'Invalid or expired verification token' },
        { status: 400 }
      );
    }

    // Mark email as verified
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationTokenExpires = undefined;
    await user.save();

    console.log('Email verified for user:', user._id);

    return Response.json({
      success: true,
      message: 'Email verified successfully! You can now log in.',
    });
  } catch (error) {
    console.error('POST /api/auth/verify-email error:', error);
    return Response.json(
      { success: false, error: error.message || 'Email verification failed' },
      { status: 400 }
    );
  }
}
