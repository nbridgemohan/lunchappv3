import dbConnect from '@/lib/mongodb';
import LunchLocation from '@/models/LunchLocation';
import User from '@/models/User';
import { authenticateRequest } from '@/lib/auth';
import { getTrinidadDateRange } from '@/lib/dateUtils';

export async function POST(request, { params }) {
  try {
    const { authenticated, user, response } = await authenticateRequest(request);

    if (!authenticated) {
      return response;
    }

    await dbConnect();

    // Get today's date range in Trinidad timezone
    const { startOfDay, endOfDay } = getTrinidadDateRange();

    const location = await LunchLocation.findById(params.id);

    if (!location) {
      return Response.json(
        { success: false, error: 'Location not found' },
        { status: 404 }
      );
    }

    // Initialize votesHistory if it doesn't exist
    if (!location.votesHistory) {
      location.votesHistory = [];
    }

    // Check if user already voted on THIS location TODAY
    const todayVoteIndex = location.votesHistory.findIndex(
      (vote) =>
        vote.userId.toString() === user.userId.toString() &&
        new Date(vote.voteDate) >= startOfDay &&
        new Date(vote.voteDate) <= endOfDay
    );

    const hasVotedOnThis = todayVoteIndex !== -1;

    if (hasVotedOnThis) {
      // Remove today's vote from this location
      location.votesHistory.splice(todayVoteIndex, 1);
    } else {
      // Check if user has already voted on ANY other location TODAY
      const userVotedToday = await LunchLocation.findOne({
        votesHistory: {
          $elemMatch: {
            userId: user.userId,
            voteDate: { $gte: startOfDay, $lte: endOfDay },
          },
        },
        _id: { $ne: params.id }, // Exclude current location
        isActive: true,
      });

      if (userVotedToday) {
        return Response.json(
          { success: false, error: 'You can only vote for one restaurant per day. Unvote from your current choice first.' },
          { status: 400 }
        );
      }

      // Add vote for today
      location.votesHistory.push({
        userId: user.userId,
        voteDate: startOfDay,
      });
    }

    // Update the legacy voters array and votes count for today
    const todayVotes = location.votesHistory.filter((vote) => {
      const voteDate = new Date(vote.voteDate);
      return voteDate >= startOfDay && voteDate <= endOfDay;
    });

    location.voters = todayVotes.map((vote) => vote.userId);
    location.votes = todayVotes.length;

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
