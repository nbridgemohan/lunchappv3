import dbConnect from '@/lib/mongodb';
import LunchLocation from '@/models/LunchLocation';
import User from '@/models/User';
import { authenticateRequest } from '@/lib/auth';
import { getTrinidadDateRange } from '@/lib/dateUtils';

export async function GET(request) {
  try {
    await dbConnect();

    // Get today's date range in Trinidad timezone
    const { startOfDay, endOfDay } = getTrinidadDateRange();

    const locations = await LunchLocation.find({ isActive: true })
      .populate('createdBy', 'username email')
      .sort({ votes: -1, createdAt: -1 });

    // Filter votes to only show today's votes
    const locationsWithTodayVotes = await Promise.all(
      locations.map(async (location) => {
        const locationObj = location.toObject();

        // Filter votesHistory for today only
        const todayVotes = (locationObj.votesHistory || []).filter((vote) => {
          const voteDate = new Date(vote.voteDate);
          return voteDate >= startOfDay && voteDate <= endOfDay;
        });

        // Update voters and votes count to reflect only today's votes
        const voterIds = todayVotes.map((vote) => vote.userId);

        // Fetch voter details
        const voters = await User.find({ _id: { $in: voterIds } }).select('username email');

        locationObj.voters = voters;
        locationObj.votes = todayVotes.length;

        return locationObj;
      })
    );

    // Re-sort by today's vote count
    locationsWithTodayVotes.sort((a, b) => b.votes - a.votes || new Date(b.createdAt) - new Date(a.createdAt));

    return Response.json(
      {
        success: true,
        data: locationsWithTodayVotes,
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
