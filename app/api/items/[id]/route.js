import dbConnect from '@/lib/mongodb';
import Item from '@/models/Item';
import { ObjectId } from 'mongodb';

export async function GET(request, { params }) {
  await dbConnect();

  try {
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
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  await dbConnect();

  try {
    const { id } = params;
    const body = await request.json();
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

    return Response.json({ success: true, data: item });
  } catch (error) {
    return Response.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}

export async function DELETE(request, { params }) {
  await dbConnect();

  try {
    const { id } = params;
    const item = await Item.findByIdAndDelete(id);

    if (!item) {
      return Response.json(
        { success: false, error: 'Item not found' },
        { status: 404 }
      );
    }

    return Response.json({ success: true, data: item });
  } catch (error) {
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
