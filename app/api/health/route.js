import dbConnect from '@/lib/mongodb';

export async function GET(request) {
  try {
    console.log('Health check: Attempting MongoDB connection...');
    await dbConnect();
    console.log('Health check: MongoDB connection successful');

    return Response.json({
      success: true,
      message: 'MongoDB connection is working',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Health check: MongoDB connection failed:', error);
    return Response.json(
      {
        success: false,
        message: 'MongoDB connection failed',
        error: error.message || 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
