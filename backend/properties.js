const express = require('express');
const multer = require('multer');  // Import multer
const propertySchema = require('./schemas/propertySchema');
const { bucket, firestore } = require('./firebase'); // Import Firestore
const { v4: uuidv4 } = require('uuid'); // Unique IDs
const { ref, uploadBytes, getDownloadURL } = require("firebase/storage");
const os = require('os');
const fs = require('fs');
const path = require('path');
const convertToHLS = require('./convertToHLS');
const prisma = require('./prisma/prismaClient');

// Multer Configuration: Store files in memory for Firebase upload
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

/**
 * Function to upload media (images/videos) to Firebase Storage
 */
const uploadMedia = async (files, userId) => {
  const mediaUrls = { images: [], videos: [] };

  for (const file of files) {
    const isVideo = file.mimetype.startsWith('video/');
    const folder = isVideo ? 'videos' : 'images';

    const uniqueFileName = `${folder}/${userId}/${uuidv4()}-${file.originalname}`;
    const fileUpload = bucket.file(uniqueFileName);
    await fileUpload.save(file.buffer, {
      metadata: { contentType: file.mimetype },
    });
    await fileUpload.makePublic();
    const downloadURL = `https://storage.googleapis.com/${bucket.name}/${uniqueFileName}`;

    if (isVideo) {
      mediaUrls.videos.push(downloadURL);
    } else {
      mediaUrls.images.push(downloadURL);
    }
  }

  return mediaUrls;
};

// Create property route with upload middleware
const createProperty = (io) => async (req, res, next) => {
  try {
    const {
      address,
      city,
      state,
      price,
      bedrooms,
      bathrooms,
      name,
      description,
      liveEnabled,
      liveTitle,
      liveDate,
      liveDuration,
    } = req.body;

    // Debugging the input data
    console.log('Request Body:', req.body);
    console.log('Uploaded Files:', req.files);
    console.log('Authenticated User:', req.user);

    // Validate required fields
    if (!address || !city || !state || !price || !bedrooms || !bathrooms) {
      console.log('Validation Error: Missing fields');
      return res.status(400).json({ message: "All fields are required." });
    }

    if (!req.files || req.files.length === 0) {
      console.log('Validation Error: No image files uploaded');
      return res.status(400).json({ message: "At least one image or video file is required." });
    }

    const priceFloat = parseFloat(price);
    if (isNaN(priceFloat)) {
      console.log('Validation Error: Price is not a valid number');
      return res.status(400).json({ message: "Price must be a valid number." });
    }

    const userId = req.user.id;
    console.log('Fetching landlord details for userId:', userId);
    const landlord = await prisma.landlord.findUnique({ where: { userId: userId } });

    if (!landlord) {
      console.log('Error: Landlord not found');
      return res.status(404).json({ message: "Landlord not found" });
    }

    const landlordId = landlord.id;
    console.log('Uploading media files for landlordId:', landlordId);
    const mediaUrls = await uploadMedia(req.files, userId);
    console.log('Media URLs:', mediaUrls);

    // Construct data object
    const propertyData = {
      address,
      city,
      state,
      price: priceFloat,
      bedrooms: parseInt(bedrooms),
      bathrooms: parseInt(bathrooms),
      landlordId,
      description: description || null,
      liveEnabled: liveEnabled === 'true',
    };

    // Include live session info only if liveEnabled is true
    if (liveEnabled === 'true') {
      propertyData.liveTitle = liveTitle || null;
      propertyData.liveDate = liveDate ? new Date(liveDate) : null;
      propertyData.liveDuration = liveDuration ? parseInt(liveDuration) : null;
    }

    const property = await prisma.property.create({ data: propertyData });

    const mediaCreateData = [
      ...mediaUrls.images.map(url => ({ url, type: 'image', propertyId: property.id })),
      ...mediaUrls.videos.map(url => ({ url, type: 'video', propertyId: property.id }))
    ];
    await prisma.media.createMany({ data: mediaCreateData });

    const notificationMessage = `${name} added a property in ${city}`;
    io.emit('receiveNotification', { message: notificationMessage, property });

    res.status(201).json({
      message: "Property created successfully",
      property,
      landlordId,
      media: mediaUrls,
    });

  } catch (error) {
    console.error("Error creating property:", error);
    next(error);
  }
};


// Get all properties
const getProperties = async (req, res) => {
    try {
        const userId = req.user.id;
        console.log('Logged-in User ID:', userId);

        const landlord = await prisma.landlord.findUnique({
            where: { userId: userId },
        });

        if (!landlord) {
            console.log('Error: Landlord not found for this user');
            return res.status(404).json({ message: 'Landlord not found for this user' });
        }

        const landlordId = landlord.id;
        console.log('Fetching properties for landlordId:', landlordId);

        const properties = await prisma.property.findMany({
            where: { landlordId: landlordId },
            include: {
                landlord: true,
                media: true,
            },
        });

        if (properties.length === 0) {
            console.log('No properties found for this landlord yet');
            return res.status(200).json([]);
        }

        console.log('Properties fetched successfully:', properties);
        res.status(200).json(properties);
    } catch (error) {
        console.error('Error fetching properties:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Get all properties available for tenants
const getAllProperties = async (req, res) => {
    try {
        const properties = await prisma.property.findMany({
            include: {
                landlord: true,
                media: true,
            },
        });

        if (properties.length === 0) {
            return res.status(200).json([]);
        }

        console.log('All properties fetched successfully:', properties);
        res.status(200).json(properties);
    } catch (error) {
        console.error('Error fetching properties:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Search properties based on criteria
const searchProperties = async (req, res) => {
  try {
    const {
      location,
      minPrice,
      maxPrice,
      bedrooms,
      bathrooms,
      liveOnly // optional checkbox on frontend like "show only live-enabled properties"
    } = req.query;

    const searchFilters = {};

    if (location) searchFilters.city = { contains: location, mode: 'insensitive' };
    if (minPrice) searchFilters.price = { gte: parseFloat(minPrice) };
    if (maxPrice) {
      searchFilters.price = {
        ...(searchFilters.price || {}),
        lte: parseFloat(maxPrice),
      };
    }
    if (bedrooms) searchFilters.bedrooms = parseInt(bedrooms, 10);
    if (bathrooms) searchFilters.bathrooms = parseInt(bathrooms, 10);
    if (liveOnly === 'true') searchFilters.liveEnabled = true;

    const properties = await prisma.property.findMany({
      where: searchFilters,
      include: {
        landlord: true,
        media: true,
      },
      orderBy: [{ price: 'asc' }, { bedrooms: 'desc' }],
    });

    // Everything the frontend needs (includes description + live data)
    return res.status(200).json(properties.length ? properties : []);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get total number of properties created by the logged-in landlord
const getPropertyCountByLandlord = async (req, res) => {
    try {
        console.log('req.user:', req.user);
        const userId = req.user.id;
        console.log('Fetching property count for userId:', userId);

        const landlord = await prisma.landlord.findUnique({
            where: { userId: userId },
        });

        if (!landlord) {
            console.log('Landlord not found for user');
            return res.status(404).json({ message: 'Landlord not found' });
        }

        const propertyCount = await prisma.property.count({
            where: { landlordId: landlord.id }
        });

        console.log(`Landlord ID ${landlord.id} has ${propertyCount} properties.`);

        res.status(200).json({ totalProperties: propertyCount });

    } catch (error) {
        console.error('Error counting properties:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};


/**
 * POST /api/upload-profile-pic
 * Expects: JSON body with { image: base64 string }
 */
const uploadProfilePic = async (req, res) => {
    try {
        // Ensure userId is a string
        const userId = req.user?.id?.toString();

        if (!userId) {
            return res.status(400).json({ message: 'User ID is missing or invalid.' });
        }

        const { image } = req.body;

        if (!image) {
            return res.status(400).json({ message: 'No image provided.' });
        }

        // Convert base64 string to buffer
        const buffer = Buffer.from(image, 'base64');

        // Generate a unique filename for each user
        const fileName = `profile-pictures/${userId}/avatar-${uuidv4()}.jpg`;
        const file = bucket.file(fileName);

        // Save the image in Firebase storage
        await file.save(buffer, {
            metadata: {
                contentType: 'image/jpeg',
            },
        });

        // Make the image public (or you can handle permissions differently)
        await file.makePublic();

        // Generate a download URL for the image
        const downloadURL = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

        // Save the image URL in Firestore under the correct user document
        await firestore.collection('users').doc(userId).set(
            { profilePicUrl: downloadURL },
            { merge: true }
        );

        return res.status(200).json({ url: downloadURL });

    } catch (error) {
        console.error('Error uploading profile picture:', error);
        return res.status(500).json({ message: 'Upload failed', error: error.message });
    }
};


// Update a property
const updateProperty = async (req, res) => {
    try {
        const { error } = propertySchema.validate(req.body);
        if (error) return res.status(400).json({ message: error.details[0].message });

        const property = await prisma.property.update({
            where: { id: parseInt(req.params.id) },
            data: req.body,
        });

        res.status(200).json(property);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createProperty,
    getProperties,
    updateProperty,
    searchProperties,
    getAllProperties,
    getPropertyCountByLandlord,
    uploadProfilePic
};
 