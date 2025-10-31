import dbConnect from '@/lib/mongodb';
import Item from '@/models/Item';
import { ObjectId } from 'mongodb';

export async function GET(request, { params }) {
  try {
    await dbConnect();
    const { id } = params;
    const item = await Item.findById(id);

    if (!item) {
      return Response.json(
        { success: false, error: 'Item not found' },
        { status: 404 }
      );
    }

    return Response.json({ success: true, data: item });
  } catch (error) {
    console.error('GET /api/items/[id] error:', error);
    return Response.json(
      { success: false, error: error.message || 'Failed to fetch item' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    await dbConnect();
    const { id } = params;
    const body = await request.json();
    console.log(`Updating item ${id} with data:`, body);

    const item = await Item.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });

    if (!item) {
      return Response.json(
        { success: false, error: 'Item not found' },
        { status: 404 }
      );
    }

    console.log('Item updated successfully:', item);
    return Response.json({ success: true, data: item });
  } catch (error) {
    console.error('PUT /api/items/[id] error:', error);
    return Response.json(
      { success: false, error: error.message || 'Failed to update item' },
      { status: 400 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    await dbConnect();
    const { id } = params;
    console.log(`Deleting item ${id}`);

    const item = await Item.findByIdAndDelete(id);

    if (!item) {
      return Response.json(
        { success: false, error: 'Item not found' },
        { status: 404 }
      );
    }

    console.log('Item deleted successfully:', item);
    return Response.json({ success: true, data: item });
  } catch (error) {
    console.error('DELETE /api/items/[id] error:', error);
    return Response.json(
      { success: false, error: error.message || 'Failed to delete item' },
      { status: 500 }
    );
  }
}
