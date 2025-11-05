import dbConnect from '@/lib/mongodb';
import LunchOrder from '@/models/LunchOrder';
import User from '@/models/User';
import { authenticateRequest } from '@/lib/auth';
import { getTrinidadDateRange } from '@/lib/dateUtils';

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const locationId = url.searchParams.get('locationId');

    await dbConnect();

    // Get today's date range in Trinidad timezone
    const { startOfDay, endOfDay } = getTrinidadDateRange();

    let query = {
      orderDate: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    };
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
    const { authenticated, user, response } = await authenticateRequest(request);

    if (!authenticated) {
      return response;
    }

    await dbConnect();
    const { locationId, item, cost, notes, moneyPaid } = await request.json();

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

    if (moneyPaid !== undefined && moneyPaid !== null && moneyPaid < 0) {
      return Response.json(
        { success: false, error: 'Money paid cannot be negative' },
        { status: 400 }
      );
    }

    // Get today's date in Trinidad timezone
    const { startOfDay } = getTrinidadDateRange();

    const order = await LunchOrder.create({
      locationId,
      userId: user.userId,
      item,
      cost,
      notes,
      moneyPaid: moneyPaid !== undefined ? moneyPaid : null,
      orderDate: startOfDay,
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
