import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { sendVerificationEmail } from '@/lib/email';
import crypto from 'crypto';

export async function POST(request) {
  try {
    await dbConnect();
    const { username, email, password, confirmPassword, organization } = await request.json();

    // Validation
    if (!username || !email || !password || !confirmPassword || !organization) {
      return Response.json(
        { success: false, error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate organization
    const validOrganizations = ['BGL IT'];
    if (!validOrganizations.includes(organization)) {
      return Response.json(
        { success: false, error: 'Invalid organization' },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return Response.json(
        { success: false, error: 'Passwords do not match' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return Response.json(
        { success: false, error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return Response.json(
        { success: false, error: 'Username or email already exists' },
        { status: 400 }
      );
    }

    // Generate verification token
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const emailVerificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user
    const user = await User.create({
      username,
      email,
      password,
      organization,
      emailVerificationToken,
      emailVerificationTokenExpires,
    });

    console.log('User created:', user._id);

    // Send verification email
    try {
      await sendVerificationEmail(email, emailVerificationToken, username);
    } catch (emailError) {
      console.error('Error sending verification email:', emailError);
      // Don't fail the registration if email fails
      // In production, you might want to handle this differently
    }

    return Response.json(
      {
        success: true,
        message: 'Registration successful! Please check your email to verify your account.',
        data: {
          userId: user._id,
          username: user.username,
          email: user.email,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/auth/register error:', error);
    return Response.json(
      { success: false, error: error.message || 'Registration failed' },
      { status: 400 }
    );
  }
}
