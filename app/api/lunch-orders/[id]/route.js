import dbConnect from '@/lib/mongodb';
import LunchOrder from '@/models/LunchOrder';
import { authenticateRequest } from '@/lib/auth';

export async function GET(request, { params }) {
  try {
    await dbConnect();
    const order = await LunchOrder.findById(params.id)
      .populate('locationId', 'name')
      .populate('userId', 'username email');

    if (!order) {
      return Response.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    return Response.json(
      {
        success: true,
        data: order,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('GET /api/lunch-orders/[id] error:', error);
    return Response.json(
      { success: false, error: error.message || 'Failed to fetch order' },
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
    const order = await LunchOrder.findById(params.id);

    if (!order) {
      return Response.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Only order creator can edit
    if (order.userId.toString() !== user._id.toString()) {
      return Response.json(
        { success: false, error: 'Not authorized to update this order' },
        { status: 403 }
      );
    }

    const { item, cost, notes } = await request.json();

    if (cost !== undefined && cost < 0) {
      return Response.json(
        { success: false, error: 'Cost cannot be negative' },
        { status: 400 }
      );
    }

    order.item = item || order.item;
    order.cost = cost !== undefined ? cost : order.cost;
    order.notes = notes !== undefined ? notes : order.notes;
    await order.save();
    await order.populate('locationId', 'name');
    await order.populate('userId', 'username email');

    return Response.json(
      {
        success: true,
        message: 'Order updated successfully',
        data: order,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('PUT /api/lunch-orders/[id] error:', error);
    return Response.json(
      { success: false, error: error.message || 'Failed to update order' },
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
    const order = await LunchOrder.findById(params.id);

    if (!order) {
      return Response.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Only order creator can delete
    if (order.userId.toString() !== user._id.toString()) {
      return Response.json(
        { success: false, error: 'Not authorized to delete this order' },
        { status: 403 }
      );
    }

    await LunchOrder.deleteOne({ _id: params.id });

    return Response.json(
      {
        success: true,
        message: 'Order deleted successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE /api/lunch-orders/[id] error:', error);
    return Response.json(
      { success: false, error: error.message || 'Failed to delete order' },
      { status: 400 }
    );
  }
}
