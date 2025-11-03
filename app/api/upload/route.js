import { authenticateRequest } from '@/lib/auth';

export async function POST(request) {
  try {
    const { authenticated, user, response } = await authenticateRequest(request);
    if (!authenticated) return response;

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return Response.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return Response.json(
        { success: false, error: 'Please upload a valid image file' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return Response.json(
        { success: false, error: 'Image size must be less than 5MB' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const buffer = await file.arrayBuffer();
    const cloudinaryFormData = new FormData();
    cloudinaryFormData.append('file', new Blob([buffer], { type: file.type }), file.name);
    cloudinaryFormData.append('upload_preset', process.env.CLOUDINARY_UPLOAD_PRESET);

    // Upload to Cloudinary
    const cloudinaryResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: cloudinaryFormData,
      }
    );

    if (!cloudinaryResponse.ok) {
      const error = await cloudinaryResponse.text();
      console.error('Cloudinary error:', error);
      return Response.json(
        { success: false, error: 'Failed to upload image to Cloudinary' },
        { status: 500 }
      );
    }

    const data = await cloudinaryResponse.json();

    return Response.json(
      {
        success: true,
        data: {
          url: data.secure_url,
          publicId: data.public_id,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Upload error:', error);
    return Response.json(
      { success: false, error: error.message || 'Upload failed' },
      { status: 500 }
    );
  }
}
