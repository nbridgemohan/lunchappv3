import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import jwt from 'jsonwebtoken';

export async function POST(request) {
  try {
    const session = await getServerSession();

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { username, organization } = await request.json();

    // Validate inputs
    if (!username || !organization) {
      return NextResponse.json(
        { error: 'Username and organization are required' },
        { status: 400 }
      );
    }

    // Validate username format
    if (username.length < 3 || username.length > 30) {
      return NextResponse.json(
        { error: 'Username must be between 3 and 30 characters' },
        { status: 400 }
      );
    }

    if (!/^[a-z0-9_-]+$/.test(username)) {
      return NextResponse.json(
        { error: 'Username can only contain lowercase letters, numbers, hyphens and underscores' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Check if username is already taken
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return NextResponse.json(
        { error: 'Username is already taken' },
        { status: 400 }
      );
    }

    // Find user by email (temporary user created during Google sign-in)
    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update user with chosen username and organization
    user.username = username;
    user.organization = organization;
    user.profileComplete = true;
    await user.save();

    // Generate JWT token for the custom auth system
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      { expiresIn: '7d' }
    );

    console.log('Profile completed for SSO user:', user.username);

    return NextResponse.json({
      success: true,
      message: 'Profile completed successfully',
      data: {
        userId: user._id,
        username: user.username,
        email: user.email,
        organization: user.organization,
        token,
      },
    });
  } catch (error) {
    console.error('Complete profile error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
