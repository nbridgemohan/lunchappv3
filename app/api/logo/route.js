import { authenticateRequest } from '@/lib/auth';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantName = searchParams.get('name');

    if (!restaurantName) {
      return Response.json(
        { success: false, error: 'Restaurant name is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.API_NINJA_KEY;
    if (!apiKey) {
      return Response.json(
        { success: false, error: 'API key not configured' },
        { status: 500 }
      );
    }

    // Fetch logo from API Ninjas
    const response = await fetch(`https://api.api-ninjas.com/v1/logo?name=${encodeURIComponent(restaurantName)}`, {
      headers: {
        'X-Api-Key': apiKey,
      },
    });

    if (!response.ok) {
      console.error('API Ninjas error:', response.status);
      return Response.json(
        { success: false, error: 'Failed to fetch logo from API' },
        { status: 500 }
      );
    }

    const data = await response.json();

    // Extract first result if available
    if (data && data.length > 0) {
      return Response.json(
        {
          success: true,
          data: {
            image: data[0].image,
            name: data[0].name,
            ticker: data[0].ticker || null,
          },
        },
        { status: 200 }
      );
    }

    return Response.json(
      { success: false, error: 'No logo found for this restaurant' },
      { status: 404 }
    );
  } catch (error) {
    console.error('Logo fetch error:', error);
    return Response.json(
      { success: false, error: error.message || 'Failed to fetch logo' },
      { status: 500 }
    );
  }
}
