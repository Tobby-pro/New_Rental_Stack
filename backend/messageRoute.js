const express = require('express');
const { authenticateToken } = require('./middleware/authMiddleware');
const prisma = require('./prisma/prismaClient');
const { firestore } = require('./firebase'); // Assuming Firestore is initialized here

module.exports = (io) => {
    const router = express.Router();

    // Send a message
  router.post('/', authenticateToken, async (req, res) => {
    const { message, messageType } = req.body;
    const conversationId = parseInt(req.body.conversationId, 10); // Ensure conversationId is an integer
    console.log('Post for Received conversationId:', conversationId); // Log the conversationId
    const userId = req.user.id;

    if (isNaN(conversationId)) {
        return res.status(400).json({ error: 'Invalid conversationId. Must be an integer.' });
    }

    try {
        const validMessageType = messageType && ['TEXT', 'IMAGE', 'VIDEO'].includes(messageType.toUpperCase())
            ? messageType.toUpperCase()
            : 'TEXT'; // Default to 'TEXT' if invalid or not provided

        // Fetch landlordId from the conversation record
        const conversation = await prisma.conversation.findUnique({
            where: { id: conversationId },
            select: { landlordId: true, tenantId: true }, // Include tenantId here
        });

        if (!conversation) {
            return res.status(404).json({ error: 'Conversation not found.' });
        }

        // Step 1: Create the message using Prisma
        const chatMessage = await prisma.chat.create({
            data: {
                message,
                messageType: validMessageType,
                user: { connect: { id: userId } },
                conversation: { connect: { id: conversationId } },
                status: 'SENT', // Default status to SENT
            },
        });

        // Step 2: Store the message in Firestore
        try {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { name: true },
            });
            const userName = user?.name || "Unknown User";

            const firestoreMessage = {
                conversationId, // Now guaranteed to be an integer
                senderId: userId,
                message,
                messageType: validMessageType,
                status: 'SENT',
                timestamp: new Date(), // Store as Firestore Timestamp
                landlordId: conversation.landlordId,
                tenantId: conversation.tenantId, // Add tenantId here
                name: userName,
                lastMessage: message,
                lastMessageDate: new Date(), // Store as Firestore Timestamp
            };

            await firestore.collection('messages').add(firestoreMessage);

            
            // Emit the new message to the conversation room for both landlord and tenant
            io.to(conversation.landlordId.toString()).emit('new_message', chatMessage); // Emit to landlord
            io.to(conversation.tenantId.toString()).emit('new_message', chatMessage);   // Emit to tenant
            // Convert to string only for Socket.IO
            res.json(chatMessage); // Send the chat message in the response
        } catch (error) {
            console.error('Failed to store message in Firestore:', error);
        }
    } catch (error) {
        console.error('Failed to send message:', error);
        res.status(500).json({ error: 'Failed to send message.' });
    }
});



    // Update message status (for when the landlord reads or receives the message)
    router.post('/update-status', authenticateToken, async (req, res) => {
        const { messageId, status } = req.body; // status could be 'DELIVERED' or 'READ'

        if (!['DELIVERED', 'READ'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status.' });
        }

        try {
            // Step 1: Update message status in Prisma
            const updatedMessage = await prisma.chat.update({
                where: { id: messageId },
                data: { status: status }, // Update status to 'DELIVERED' or 'READ'
            });

            // Step 2: Emit status update to the conversation room
            io.to(updatedMessage.conversationId.toString()).emit('statusUpdate', updatedMessage);

            res.json(updatedMessage); // Send the updated message status as the response
        } catch (error) {
            console.error('Failed to update status:', error);
            res.status(500).json({ error: 'Failed to update status.' });
        }
    });

 // Fetch all conversations for a landlord
router.get('/landlord/:landlordId/conversations', authenticateToken, async (req, res) => {
    const landlordIdFromUrl = Number(req.params.landlordId); // Get landlordId from the URL
    const userId = req.user.id; // Get authenticated user's id
    const userRole = req.user.role; // Get authenticated user's role
    
    console.log(`Fetching conversations for landlordId: ${landlordIdFromUrl}. Authenticated userId: ${userId}, role: ${userRole}`);

    // Ensure the user is a landlord and that the landlordId in the URL matches the authenticated user's landlordId
    if (userRole.toLowerCase() !== 'landlord') {
        console.log(`Unauthorized access attempt by userId: ${userId} with role: ${userRole}`);
        return res.status(403).json({ error: 'Unauthorized to access these conversations.' });
    }

    // Fetch the landlord associated with the authenticated userId
    const landlord = await prisma.landlord.findUnique({
        where: { userId: userId },
    });

    if (!landlord || landlord.id !== landlordIdFromUrl) {
        console.log(`Unauthorized access attempt: landlordId from URL does not match authenticated landlordId.`);
        return res.status(403).json({ error: 'Unauthorized to access these conversations.' });
    }

    try {
        const PAGE_SIZE = 20;
        let query = firestore.collection('messages')
            .where('landlordId', '==', landlordIdFromUrl)
            .orderBy('timestamp', 'desc')
            .limit(PAGE_SIZE);

        const tenantId = req.query.tenantId ? Number(req.query.tenantId) : null;
        // Filter by tenantId if provided
        if (tenantId) {
            query = query.where('tenantId', '==', tenantId);
        }

        const conversationsSnapshot = await query.get();

        if (conversationsSnapshot.empty) {
            console.log(`No conversations found for landlordId: ${landlordIdFromUrl}`);
            return res.status(404).json({ error: 'No conversations found for this landlord.' });
        }

        const messages = conversationsSnapshot.docs.map(doc => {
            const data = doc.data();
            const formattedLastMessageDate = data.lastMessageDate?.toDate().toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            }) || null;

            const formattedTimestamp = data.timestamp?.toDate().toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            }) || null;

            return {
                conversationId: Number(data.conversationId),  // Ensure conversationId is always a number
                sender: data.name,
                message: data.message,
                lastMessage: data.lastMessage,
                lastMessageDate: formattedLastMessageDate,
                timestamp: formattedTimestamp,
                tenantId: data.tenantId // Ensure we return the tenantId for correct mapping
            };
        });

        const groupedMessages = messages.reduce((acc, message) => {
            const { conversationId, lastMessage, lastMessageDate, sender, tenantId } = message;
            if (!acc[conversationId]) {
                acc[conversationId] = {
                    conversationId,
                    name: sender,
                    lastMessage,
                    lastMessageDate,
                    tenantId // Ensure frontend can correctly map tenant
                };
            }
            return acc;
        }, {});

        res.json(groupedMessages);
    } catch (error) {
        console.error('Failed to fetch conversations:', error);
        res.status(500).json({ error: 'Failed to fetch conversations.' });
    }
});

// Fetch all conversations for a tenant
router.get('/tenant/:tenantId/conversations', authenticateToken, async (req, res) => {
    const tenantIdFromUrl = Number(req.params.tenantId); // Get tenantId from the URL
    const userId = req.user.id; // Get authenticated user's id
    const userRole = req.user.role; // Get authenticated user's role
    
    console.log(`Fetching conversations for tenantId: ${tenantIdFromUrl}. Authenticated userId: ${userId}, role: ${userRole}`);

    // Ensure the user is a tenant and that the tenantId in the URL matches the authenticated user's tenantId
    if (userRole.toLowerCase() !== 'tenant') {
        console.log(`Unauthorized access attempt by userId: ${userId} with role: ${userRole}`);
        return res.status(403).json({ error: 'Unauthorized to access these conversations.' });
    }

    // Fetch the tenant associated with the authenticated userId
    const tenant = await prisma.tenant.findUnique({
        where: { userId: userId },
    });

    if (!tenant || tenant.id !== tenantIdFromUrl) {
        console.log(`Unauthorized access attempt: tenantId from URL does not match authenticated tenantId.`);
        return res.status(403).json({ error: 'Unauthorized to access these conversations.' });
    }

    try {
        const PAGE_SIZE = 20;
        let query = firestore.collection('messages')
            .where('tenantId', '==', tenantIdFromUrl)
            .orderBy('timestamp', 'desc')
            .limit(PAGE_SIZE);

        const landlordId = req.query.landlordId ? Number(req.query.landlordId) : null;
        // Filter by landlordId if provided
        if (landlordId) {
            query = query.where('landlordId', '==', landlordId);
        }

        const conversationsSnapshot = await query.get();

        if (conversationsSnapshot.empty) {
            console.log(`No conversations found for tenantId: ${tenantIdFromUrl}`);
            return res.status(404).json({ error: 'No conversations found for this tenant.' });
        }

        const messages = conversationsSnapshot.docs.map(doc => {
            const data = doc.data();
            const formattedLastMessageDate = data.lastMessageDate?.toDate().toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            }) || null;

            const formattedTimestamp = data.timestamp?.toDate().toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            }) || null;

            return {
                conversationId: Number(data.conversationId),  // Ensure conversationId is always a number
                sender: data.name,
                message: data.message,
                lastMessage: data.lastMessage,
                lastMessageDate: formattedLastMessageDate,
                timestamp: formattedTimestamp,
                landlordId: data.landlordId // Ensure we return the landlordId for correct mapping
            };
        });

        const groupedMessages = messages.reduce((acc, message) => {
            const { conversationId, lastMessage, lastMessageDate, sender, landlordId } = message;
            if (!acc[conversationId]) {
                acc[conversationId] = {
                    conversationId,
                    name: sender,
                    lastMessage,
                    lastMessageDate,
                    landlordId // Ensure frontend can correctly map landlord
                };
            }
            return acc;
        }, {});

        res.json(groupedMessages);
    } catch (error) {
        console.error('Failed to fetch conversations:', error);
        res.status(500).json({ error: 'Failed to fetch conversations.' });
    }
});



// Fetch messages for a specific conversation
router.get('/conversation/:conversationId', authenticateToken, async (req, res) => {
    const conversationId = Number(req.params.conversationId); // Ensure conversationId is a number
    const userId = req.user.id;  // Logged-in user

    console.log(`\n\n======= START DEBUGGING =======`);
    console.log(`Requested conversationId: ${conversationId}`);
    console.log(`Logged-in userId: ${userId}`);

    try {
        // Fetch conversation details
        const conversationSnapshot = await firestore.collection('messages')
            .where('conversationId', '==', conversationId)
            .limit(1)
            .get();

        if (conversationSnapshot.empty) {
            console.log("❌ No conversation found in Firestore.");
            return res.status(404).json({ error: "Conversation not found." });
        }

        const conversationDoc = conversationSnapshot.docs[0];
        const conversationData = conversationDoc.data();

        console.log(`✅ Conversation found:`, conversationData);

        // Fetch the Tenant & Landlord user IDs
        const tenant = await prisma.tenant.findUnique({
            where: { id: conversationData.tenantId }, 
            select: { userId: true }
        });

        const landlord = await prisma.landlord.findUnique({
            where: { id: conversationData.landlordId },
            select: { userId: true }
        });

        console.log(`Fetched Tenant userId: ${tenant?.userId}`);
        console.log(`Fetched Landlord userId: ${landlord?.userId}`);

        // Check if logged-in user is part of this conversation
        if (![tenant?.userId, landlord?.userId].includes(userId)) {
            console.log("❌ Unauthorized access detected!");
            return res.status(403).json({ error: "You are not authorized to view this conversation." });
        }

        // Fetch messages for this conversation
        console.log("✅ Fetching messages for conversation...");
        const messagesSnapshot = await firestore.collection('messages')
            .where('conversationId', '==', conversationId)
            .orderBy('timestamp', 'desc')
            .get();

        if (messagesSnapshot.empty) {
            console.log("❌ No messages found.");
            return res.status(404).json({ error: "No messages found in this conversation." });
        }

        console.log("✅ Messages found. Formatting...");

        const formattedMessages = messagesSnapshot.docs.map(doc => {
            const msg = doc.data();
            return {
                id: doc.id,
                conversationId: Number(msg.conversationId), // Ensure conversationId is a number
                senderId: msg.senderId,
                senderName: msg.name,
                message: msg.message,
                messageType: msg.messageType,
                status: msg.status,
                timestamp: msg.timestamp.toDate ? msg.timestamp.toDate() : new Date(msg.timestamp),
            };
        });

        console.log("✅ Returning messages to frontend.");
        res.json(formattedMessages);
        
    } catch (error) {
        console.error("🚨 ERROR:", error);
        res.status(500).json({ error: "Failed to fetch messages." });
    }
});

// Mark all messages in a conversation as read
router.post('/mark-read', authenticateToken, async (req, res) => {
    const conversationId = Number(req.body.conversationId); // Ensure conversationId is a number
    const userId = req.user.id;

    if (!conversationId) {
        return res.status(400).json({ error: "Conversation ID is required." });
    }

    try {
        // Step 1: Update all messages in Prisma to "READ"
        await prisma.chat.updateMany({
            where: { conversationId: conversationId, userId: { not: userId } }, // Messages not sent by the user
            data: { status: "READ" },
        });

        // Step 2: Update Firestore messages for this conversation
        const messagesSnapshot = await firestore.collection('messages')
            .where('conversationId', '==', conversationId)
            .where('senderId', '!=', userId) // Only messages not sent by the user
            .orderBy('conversationId', 'asc') // Ensure it's ordered by conversationId
            .orderBy('senderId', 'desc') // Ensure it's also ordered by senderId
            .get();

        const batch = firestore.batch();
        messagesSnapshot.forEach((doc) => {
            batch.update(doc.ref, { status: "READ" });
        });
        await batch.commit();

        // Step 3: Emit socket event to update frontend
        io.to(conversationId.toString()).emit('messagesRead', { conversationId });

        res.json({ success: true, message: "Messages marked as read." });
    } catch (error) {
        console.error("Failed to mark messages as read:", error);
        res.status(500).json({ error: "Failed to mark messages as read." });
    }
});


module.exports = router;

    return router;
};
