import dbConnect from '@/lib/mongodb';
import LunchOrder from '@/models/LunchOrder';
import { authenticateRequest } from '@/lib/auth';

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const locationId = url.searchParams.get('locationId');

    await dbConnect();

    let query = {};
    if (locationId) {
      query.locationId = locationId;
    }

    const orders = await LunchOrder.find(query)
      .populate('locationId', 'name')
      .populate('userId', 'username email')
      .sort({ createdAt: -1 });

    return Response.json(
      {
        success: true,
        data: orders,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('GET /api/lunch-orders error:', error);
    return Response.json(
      { success: false, error: error.message || 'Failed to fetch orders' },
      { status: 400 }
    );
  }
}

export async function POST(request) {
  try {
    const { user } = await authenticateRequest(request);

    await dbConnect();
    const { locationId, item, cost, notes } = await request.json();

    if (!locationId || !item || cost === undefined) {
      return Response.json(
        { success: false, error: 'Location, item, and cost are required' },
        { status: 400 }
      );
    }

    if (cost < 0) {
      return Response.json(
        { success: false, error: 'Cost cannot be negative' },
        { status: 400 }
      );
    }

    const order = await LunchOrder.create({
      locationId,
      userId: user._id,
      item,
      cost,
      notes,
    });

    await order.populate('locationId', 'name');
    await order.populate('userId', 'username email');

    return Response.json(
      {
        success: true,
        message: 'Order created successfully',
        data: order,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/lunch-orders error:', error);
    return Response.json(
      { success: false, error: error.message || 'Failed to create order' },
      { status: 400 }
    );
  }
}
