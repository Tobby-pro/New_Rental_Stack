

module.exports = function setupChatSocket(io) {
    const activeLandlords = {};
    const activeTenants = {};

    io.on('connection', (socket) => {
        console.log('New client connected:', socket.id);

        socket.on('register_landlord', (landlordId) => {
            activeLandlords[landlordId] = socket.id;
            console.log(`Landlord ${landlordId} connected`);
        });

        socket.on('register_tenant', (tenantId) => {
            activeTenants[tenantId] = socket.id;
            console.log(`Tenant ${tenantId} connected`);
        });

        socket.on('joinRoom', (conversationId) => {
            console.log(`User ${socket.id} joined room: ${conversationId}`);
            socket.join(conversationId);
        });

        socket.on('send_message_to_landlord', (message) => {
            const landlordSocketId = activeLandlords[message.landlordId];
            if (landlordSocketId) {
            io.to(landlordSocketId).emit('new_message', {
                sender: 'tenant',
                tenantId: message.tenantId,
                landlordId: message.landlordId,
                content: message.content,
            
                });
                console.log(`Message from tenant ${message.tenantId} sent to landlord ${message.landlordId}`);
            }
        });

        socket.on('send_message_to_tenant', (message) => {
            const tenantSocketId = activeTenants[message.tenantId];
           if (tenantSocketId) {
            io.to(tenantSocketId).emit('new_message', {
                sender: 'landlord',
                tenantId: message.tenantId,
                landlordId: message.landlordId,
                content: message.content,
            });
                console.log(`Message from landlord ${message.landlordId} sent to tenant ${message.tenantId}`);
            }
        });

        socket.on('send_message_to_room', (conversationId, message) => {
            io.to(conversationId).emit('new_message', message);
        });

        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);

            for (let landlordId in activeLandlords) {
                if (activeLandlords[landlordId] === socket.id) {
                    delete activeLandlords[landlordId];
                    console.log(`Landlord ${landlordId} disconnected`);
                }
            }

            for (let tenantId in activeTenants) {
                if (activeTenants[tenantId] === socket.id) {
                    delete activeTenants[tenantId];
                    console.log(`Tenant ${tenantId} disconnected`);
                }
            }
        });
    });
};
