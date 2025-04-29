const jwt = require('jsonwebtoken');

// Middleware to authenticate and extract userId from the token
const authenticateUser = async (req, res, next) => {
  // Try to get token from different sources
  let token = req.header('x-auth-token');
  
  if (!token) {
    const authHeader = req.header('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }
  
  // Try to get token from query parameters
  if (!token && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    // Debug information
    console.log('Received token:', token);
    console.log('JWT_SECRET:', process.env.JWT_SECRET);
    
    // Clean up the token (remove any quotes, spaces, etc.)
    token = token.trim().replace(/^["']|["']$/g, '');
    
    // Verify the token using the secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token decoded successfully:', decoded);
    
    if (!decoded.userId) {
      return res.status(401).json({ message: 'Invalid token format' });
    }

    // Attach userId to the request object
    req.userId = decoded.userId;
    next();
  } catch (error) {
    console.error('Token verification error:', error.message);
    console.error('Error name:', error.name);
    return res.status(401).json({ 
      message: 'Invalid token',
      error: error.message 
    });
  }
};

module.exports = authenticateUser;
