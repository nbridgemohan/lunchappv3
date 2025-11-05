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

    await dbConnect();

    // Find user by email
    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if profile is complete
    if (!user.profileComplete) {
      return NextResponse.json(
        { needsProfileCompletion: true },
        { status: 200 }
      );
    }

    // Generate JWT token for the custom auth system
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      { expiresIn: '7d' }
    );

    console.log('SSO user logged in:', user.username);

    return NextResponse.json({
      success: true,
      data: {
        userId: user._id,
        username: user.username,
        email: user.email,
        organization: user.organization,
        token,
      },
    });
  } catch (error) {
    console.error('SSO login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
