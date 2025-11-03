import dbConnect from '@/lib/mongodb';
import LunchLocation from '@/models/LunchLocation';
import User from '@/models/User';
import { authenticateRequest } from '@/lib/auth';
import { getTrinidadDateRange } from '@/lib/dateUtils';

export async function GET(request) {
  try {
    await dbConnect();
    const locations = await LunchLocation.find({ isActive: true })
      .populate('createdBy', 'username email')
      .populate('voters', 'username email')
      .sort({ votes: -1, createdAt: -1 });

    return Response.json(
      {
        success: true,
        data: locations,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('GET /api/lunch-locations error:', error);
    return Response.json(
      { success: false, error: error.message || 'Failed to fetch locations' },
      { status: 400 }
    );
  }
}

export async function POST(request) {
  try {
    const { authenticated, user, response } = await authenticateRequest(request);

    if (!authenticated) {
      return response;
    }

    await dbConnect();
    const { name, description, logoUrl, emoji } = await request.json();

    if (!name) {
      return Response.json(
        { success: false, error: 'Restaurant name is required' },
        { status: 400 }
      );
    }

    const location = await LunchLocation.create({
      name,
      description,
      logoUrl: logoUrl || null,
      emoji: emoji || '🍽️',
      createdBy: user.userId,
    });

    await location.populate('createdBy', 'username email');

    return Response.json(
      {
        success: true,
        message: 'Restaurant added successfully',
        data: location,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/lunch-locations error:', error);
    return Response.json(
      { success: false, error: error.message || 'Failed to add location' },
      { status: 400 }
    );
  }
}
