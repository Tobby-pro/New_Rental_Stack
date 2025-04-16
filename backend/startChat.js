const express = require('express');
const prisma = require('./prisma/prismaClient'); // Import Prisma client for database interactions
const { authenticateToken } = require('./middleware/authMiddleware');

module.exports = (io) => {
    const router = express.Router();

    router.post('/start-chat', authenticateToken, async (req, res) => {
    const { propertyId } = req.body; // The property the tenant is interested in
    const userId = req.user.id; // The tenant's user ID (authenticated user)

    console.log('🔍 Request Body:', req.body);
    console.log('🔍 Authenticated User ID:', userId);

    try {
        // Check if the tenant exists in the Tenant table
        const tenantExists = await prisma.tenant.findUnique({
            where: { userId: userId }, // Match userId with the authenticated user's ID
        });

        console.log('🔍 Tenant Retrieved:', tenantExists);
        if (!tenantExists) {
            return res.status(404).json({
                message: `Tenant not found for userId: ${userId}. Please register first!`
            });
        }

        // Find the property to get the landlord ID
        const property = await prisma.property.findUnique({
            where: { id: propertyId },
            include: { landlord: true }, // Include landlord details
        });

        console.log('🔍 Property Retrieved:', property);

        if (!property) {
            return res.status(404).json({ message: 'Property not found' });
        }

        if (!property.landlordId) {
            return res.status(400).json({ message: 'Property is not linked to a landlord' });
        }

        const landlordId = property.landlordId; // Get the landlord ID

        console.log('🔍 Landlord ID:', landlordId);

        // Validate tenantId, landlordId, and propertyId
        if (!tenantExists.id || !landlordId || !propertyId) {
            return res.status(400).json({
                message: 'Missing required data: tenantId, landlordId, or propertyId',
                tenantId: tenantExists.id,
                landlordId,
                propertyId
            });
        }

        // Create or find an existing conversation
        const conversation = await prisma.conversation.upsert({
            where: {
                landlordId_tenantId_propertyId: {
                    landlordId,
                    tenantId: tenantExists.id, // Use tenantExists.id (tenantId from Tenant table)
                    propertyId,
                },
            },
            update: {
                updatedAt: new Date(), // Update the timestamp
            },
            create: {
                landlordId,
                tenantId: tenantExists.id, // Use tenantExists.id (tenantId from Tenant table)
                propertyId,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        });

        console.log('✅ Conversation Created/Retrieved:', conversation);

        // Respond with the conversation ID
        res.status(200).json({ conversationId: conversation.id });
    } catch (error) {
        console.error('❌ Detailed Error in startChat:', error);
        res.status(500).json({ error: 'An error occurred while starting the chat.', details: error.message });
    }
});


router.get('/', authenticateToken, async (req, res) => {
    const { landlordId, tenantId } = req.query;
    const userId = req.user.id;  // Extract userId from the authenticated token

    console.log('Fetching chat for landlordId:', landlordId, 'tenantId:', tenantId);
    console.log('Authenticated userId from token:', userId);

    try {
        let query = {};

        // Determine if the user is a landlord or tenant
        const landlord = await prisma.landlord.findUnique({ where: { userId } });
        const tenant = await prisma.tenant.findUnique({ where: { userId } });

        if (landlord) {
            query.landlordId = landlord.id;
            if (tenantId && tenantId !== 'null') {
                query.tenantId = parseInt(tenantId); // Convert to number only if valid
            }
        } else if (tenant) {
            query.tenantId = tenant.id;
            if (!landlordId || landlordId === 'null') {
                return res.status(400).json({ message: 'landlordId is required when a tenant is fetching a chat.' });
            }
            query.landlordId = parseInt(landlordId);
        } else {
            return res.status(403).json({ message: 'User is not a registered landlord or tenant.' });
        }

        // Fetch the conversation
        const conversation = await prisma.conversation.findFirst({ where: query });

        if (conversation) {
            return res.status(200).json({ conversationId: conversation.id });
        } else {
            return res.status(404).json({ message: 'No conversation found for this user' });
        }
    } catch (error) {
        console.error('Error fetching chat:', error);
        return res.status(500).json({ message: 'Failed to fetch chat', details: error.message });
    }
});

return router;
}