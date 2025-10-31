import dbConnect from '@/lib/mongodb';
import Item from '@/models/Item';

export async function GET(request) {
  try {
    await dbConnect();
    const items = await Item.find({}).sort({ createdAt: -1 });
    return Response.json({ success: true, data: items });
  } catch (error) {
    console.error('GET /api/items error:', error);
    return Response.json(
      { success: false, error: error.message || 'Failed to fetch items' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();
    console.log('Creating item with data:', body);

    if (!body.title || !body.description) {
      return Response.json(
        { success: false, error: 'Title and description are required' },
        { status: 400 }
      );
    }

    const item = await Item.create(body);
    console.log('Item created successfully:', item);
    return Response.json({ success: true, data: item }, { status: 201 });
  } catch (error) {
    console.error('POST /api/items error:', error);
    return Response.json(
      { success: false, error: error.message || 'Failed to create item' },
      { status: 400 }
    );
  }
}
