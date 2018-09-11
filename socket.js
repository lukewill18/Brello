var sockets = {};

module.exports = {
    getSockets: function() {
        return sockets;
    },
    init: function(server) {
        const io = require('socket.io')(server);
        io.on('connection', function(socket) {
            const id = socket.handshake.query.id;
            if(id !== undefined) {
                sockets[id] = socket;
            }          
            socket.on('disconnect', function(){
                for(let i in sockets) {
                    if(sockets[i].id === socket.id) {
                        console.log(sockets[i].id, "has disconnected");
                    }
                }
            });
        });
    }
}
