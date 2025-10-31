import dbConnect from '@/lib/mongodb';
import Item from '@/models/Item';

export async function GET(request) {
  await dbConnect();

  try {
    const items = await Item.find({}).sort({ createdAt: -1 });
    return Response.json({ success: true, data: items });
  } catch (error) {
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  await dbConnect();

  try {
    const body = await request.json();
    const item = await Item.create(body);
    return Response.json({ success: true, data: item }, { status: 201 });
  } catch (error) {
    return Response.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}
