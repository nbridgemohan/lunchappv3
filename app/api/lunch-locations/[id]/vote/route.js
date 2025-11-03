import dbConnect from '@/lib/mongodb';
import LunchLocation from '@/models/LunchLocation';
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

    // Check if user already voted
    const hasVoted = location.voters.includes(user._id);

    if (hasVoted) {
      // Remove vote
      location.voters = location.voters.filter((voterId) => voterId.toString() !== user._id.toString());
      location.votes -= 1;
    } else {
      // Add vote
      location.voters.push(user._id);
      location.votes += 1;
    }

    await location.save();
    await location.populate('createdBy', 'username email');
    await location.populate('voters', 'username email');

    return Response.json(
      {
        success: true,
        message: hasVoted ? 'Vote removed' : 'Vote added',
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
