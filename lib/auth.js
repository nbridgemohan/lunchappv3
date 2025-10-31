import jwt from 'jsonwebtoken';

export function verifyToken(token) {
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-secret-key-change-in-production'
    );
    return decoded;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

export function extractTokenFromHeader(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
}

export function createAuthResponse(status, success, message, data = null, error = null) {
  return Response.json(
    {
      success,
      message,
      ...(data && { data }),
      ...(error && { error }),
    },
    { status }
  );
}

export async function authenticateRequest(request) {
  const token = extractTokenFromHeader(request);
  if (!token) {
    return {
      authenticated: false,
      user: null,
      response: createAuthResponse(401, false, 'Unauthorized', null, 'No token provided'),
    };
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return {
      authenticated: false,
      user: null,
      response: createAuthResponse(401, false, 'Unauthorized', null, 'Invalid or expired token'),
    };
  }

  return {
    authenticated: true,
    user: decoded,
    response: null,
  };
}
