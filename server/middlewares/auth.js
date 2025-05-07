const { readDocuments } = require('../helpers/firebaseConfig.js')
const admin = require('firebase-admin')
const { ValidateJWT } = require('../helpers/security.js')

// Authentication Middleware
// This middleware function is used to authenticate users using Firebase Auth
// It verifies the ID token sent by the client and attaches the user object to the request
// The user object contains the user's UID, role, and other profile information
// The user object is used by the authorize middleware to check user permissions
// This middleware is as a middleware for each request
const authenticate = () => {
    return async (req, res, next) => {

        req.user = null

        const authHeader = req.headers.authorization

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ status: "error", message: "Unauthenticated" });
        }

        try {
            const token = authHeader.split(' ')[1]

            // Verify Firebase ID token
            const decodedToken = ValidateJWT(token)
            const uid = decodedToken.uid
            
            // Get user document from Firestore
            const user = await readDocuments('profile', { id: uid })
            
            if (!user || user.version !== decodedToken.version) {
                return res.status(401).json({ status: "error", message: "Unauthenticated" });
            }

            req.user = {
                uid,
                role: user.role,
                ...user
            };
            next();
           
        } catch (error) {
            console.error('Authentication error:', error.message);
            return res.status(401).json({ status: "error", message: "Unauthenticated" })
        }

        next()
    }
}


// Authorization Middleware
// This middleware function is used to authorize users based on their roles
// It checks if the user object attached to the request has the required role
// The allowedRoles parameter is an array of roles that are allowed to access the route
// This middleware is used as a middleware for authorizing routes like admins, users and protectors
const authorize = (allowedRoles) => {
    return (req, res, next) => {

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ status: "error", message: "Unauthorized" });
        }
        next();
    }
}


const admin = require('firebase-admin');

module.exports = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = {
      uid: decodedToken.uid,
      role: decodedToken.role || 'user'
    };
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(401).json({ error: 'Invalid token' });
  }
};


module.exports = { authenticate, authorize }
