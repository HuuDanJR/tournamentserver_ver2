const socketIO = require('socket.io');

module.exports = (server) => {
    const io = socketIO(server);

    io.on('connection', (socket) => {
        console.log('A user connected');

        // Handle events from the client
        socket.on('eventFromClient', (data) => {
            console.log('Received data from client:', data);

            // Emit events back to the client
            socket.emit('eventFromServer', { message: 'Hello from the server!' });
        });

        // Handle disconnection
        socket.on('disconnect', () => {
            console.log('A user disconnected');
        });
    });

    return io;
};