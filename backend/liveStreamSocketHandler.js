// liveStreamSocketHandler.js

module.exports = function setupLiveStreamSocket(io) {
    io.on('connection', (socket) => {
        console.log('Live stream socket connected:', socket.id);

        // Landlord starts stream
        socket.on('start_stream', (data) => {
            console.log('Stream started by landlord:', data.landlordId);
            // You could store stream status or notify clients here
        });

        // Tenant joins stream
        socket.on('join_stream', (data) => {
            console.log(`Tenant ${data.tenantId} joined property ${data.propertyId}`);
            socket.join(data.propertyId);
        });

        // 💬 Chat logic
        socket.on('chat_message', ({ propertyId, userId, text }) => {
            console.log(`Message from ${userId} in property ${propertyId}: ${text}`);
            io.to(propertyId).emit('chat_message', { userId, text });

            // Optional: Save to Firestore here
        });

        // 🎥 Frame broadcasting
        socket.on('broadcast_frame', (frame) => {
            socket.to(frame.propertyId).emit('receive_frame', frame);
        });

        // ⛔ Stop stream
        socket.on('stop_stream', (data) => {
            console.log('Stream stopped by landlord:', data.landlordId);
            socket.to(data.propertyId).emit('stream_stopped');
        });

        // --- 🔁 WebRTC Signaling Events ---

        // Landlord sends WebRTC offer
        socket.on('offer', ({ propertyId, offer }) => {
            console.log(`Offer received for property ${propertyId}`);
            socket.to(propertyId).emit('offer', offer);
        });

        // Tenant sends WebRTC answer
        socket.on('answer', ({ propertyId, answer }) => {
            console.log(`Answer received for property ${propertyId}`);
            socket.to(propertyId).emit('answer', answer);
        });

        // ICE candidate exchange
        socket.on('ice-candidate', ({ propertyId, candidate }) => {
            console.log(`ICE candidate for property ${propertyId}`);
            socket.to(propertyId).emit('ice-candidate', candidate);
        });

        // 🔌 Disconnect
        socket.on('disconnect', () => {
            console.log('Live stream client disconnected:', socket.id);
        });
    });
};
