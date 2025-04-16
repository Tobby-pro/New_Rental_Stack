const express = require('express');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

const {
    createProperty,
    getProperties,
    searchProperties,
    getAllProperties,
    updateProperty,
    deleteProperty,
    getPropertyCountByLandlord,
    uploadProfilePic,
} = require('../properties');

const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

// Log imported functions for debugging (optional)
console.log('Router Functions Loaded:');
console.log({ createProperty, getProperties, updateProperty, deleteProperty, authenticateToken });

// Function to set up routes with io passed
const propertyRoutes = (io) => {
    // Routes
    router.post('/upload-profile-pic', authenticateToken, uploadProfilePic);
    router.post('/properties', upload.array('media', 10), authenticateToken, createProperty(io));
    router.get('/properties', authenticateToken, getAllProperties);
    router.get('/landlord/properties', authenticateToken, getProperties);
    router.get('/landlord/properties/count', authenticateToken, getPropertyCountByLandlord);
    router.get('/search', authenticateToken, searchProperties);

    return router;
};
module.exports = propertyRoutes;
