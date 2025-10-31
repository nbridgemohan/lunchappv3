import dbConnect from '@/lib/mongodb';
import Item from '@/models/Item';
import { authenticateRequest } from '@/lib/auth';

export async function GET(request) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.authenticated) {
      return auth.response;
    }

    await dbConnect();
    const items = await Item.find({ userId: auth.user.userId }).sort({ createdAt: -1 });
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
    const auth = await authenticateRequest(request);
    if (!auth.authenticated) {
      return auth.response;
    }

    await dbConnect();
    const body = await request.json();
    console.log('Creating item with data:', body);

    if (!body.title || !body.description) {
      return Response.json(
        { success: false, error: 'Title and description are required' },
        { status: 400 }
      );
    }

    const item = await Item.create({
      ...body,
      userId: auth.user.userId,
    });
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
