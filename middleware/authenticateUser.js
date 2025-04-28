const jwt = require('jsonwebtoken');

// Middleware to authenticate and extract userId from the token
const authenticateUser = async (req, res, next) => {
  const token = req.header('x-auth-token'); // or wherever you send the token (headers)

  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verify the token using the secret key
    req.userId = decoded.userId; // Attach userId to the request object
    next(); // Move to the next middleware or controller
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

module.exports = authenticateUser;
