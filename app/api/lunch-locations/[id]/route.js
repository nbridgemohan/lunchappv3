import dbConnect from '@/lib/mongodb';
import LunchLocation from '@/models/LunchLocation';
import { authenticateRequest } from '@/lib/auth';

export async function GET(request, { params }) {
  try {
    await dbConnect();
    const location = await LunchLocation.findById(params.id)
      .populate('createdBy', 'username email')
      .populate('voters', 'username email');

    if (!location) {
      return Response.json(
        { success: false, error: 'Location not found' },
        { status: 404 }
      );
    }

    return Response.json(
      {
        success: true,
        data: location,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('GET /api/lunch-locations/[id] error:', error);
    return Response.json(
      { success: false, error: error.message || 'Failed to fetch location' },
      { status: 400 }
    );
  }
}

export async function PUT(request, { params }) {
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

    const data = await request.json();
    const { name, description } = data;

    // Only creator can edit
    if (location.createdBy.toString() !== user.userId.toString()) {
      return Response.json(
        { success: false, error: 'Not authorized to update this location' },
        { status: 403 }
      );
    }

    location.name = name || location.name;
    location.description = description || location.description;
    await location.save();
    await location.populate('createdBy', 'username email');

    return Response.json(
      {
        success: true,
        message: 'Location updated successfully',
        data: location,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('PUT /api/lunch-locations/[id] error:', error);
    return Response.json(
      { success: false, error: error.message || 'Failed to update location' },
      { status: 400 }
    );
  }
}

export async function DELETE(request, { params }) {
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

    // Only creator can delete
    if (location.createdBy.toString() !== user.userId.toString()) {
      return Response.json(
        { success: false, error: 'Not authorized to delete this location' },
        { status: 403 }
      );
    }

    await LunchLocation.deleteOne({ _id: params.id });

    return Response.json(
      {
        success: true,
        message: 'Location deleted successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE /api/lunch-locations/[id] error:', error);
    return Response.json(
      { success: false, error: error.message || 'Failed to delete location' },
      { status: 400 }
    );
  }
}
