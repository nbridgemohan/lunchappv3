import dbConnect from '@/lib/mongodb';
import LunchLocation from '@/models/LunchLocation';
import User from '@/models/User';
import { authenticateRequest } from '@/lib/auth';

export async function POST(request, { params }) {
  try {
    const { authenticated, user, response } = await authenticateRequest(request);

    if (!authenticated) {
      return response;
    }

    await dbConnect();
    const location = await LunchLocation.findById(params.id);

    if (!location) {
      return Response.json(
        { success: false, error: 'Location not found' },
        { status: 404 }
      );
    }

    // Check if user already voted on THIS location
    const hasVotedOnThis = location.voters.includes(user.userId);

    if (hasVotedOnThis) {
      // User can only unvote from the location they voted for
      location.voters = location.voters.filter((voterId) => voterId.toString() !== user.userId.toString());
      location.votes -= 1;
    } else {
      // Check if user has already voted on ANY other location
      const userVotedLocations = await LunchLocation.countDocuments({
        voters: user.userId,
        _id: { $ne: params.id }, // Exclude current location
        isActive: true,
      });

      if (userVotedLocations > 0) {
        return Response.json(
          { success: false, error: 'You can only vote for one restaurant. Unvote from your current choice first.' },
          { status: 400 }
        );
      }

      // Add vote
      location.voters.push(user.userId);
      location.votes += 1;
    }

    await location.save();
    await location.populate('createdBy', 'username email');
    await location.populate('voters', 'username email');

    return Response.json(
      {
        success: true,
        message: hasVotedOnThis ? 'Vote removed' : 'Vote added',
        data: location,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('POST /api/lunch-locations/[id]/vote error:', error);
    return Response.json(
      { success: false, error: error.message || 'Failed to vote' },
      { status: 400 }
    );
  }
}
