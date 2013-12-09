"use strict";
var port = process.env['app_port'] || 8080;
var io = require("socket.io").listen(port);

// configuration
io.set('log level', 1);
io.set('heartbeat timeout', 30);
io.enable('browser client minification');
io.set('transports', ['websocket']);

console.log("info: listening on port " + port);

// global variables
var userCounter = 0;
var noop = function(){};

io.sockets.on('connection',
    function (socket) {
        socket.on('register', function (data, callback) {
            callback = callback || noop;
            if (data.r === undefined) {
                callback({success: false, error: "no room selected", data: null});
                return;
            }
            var userArray = [];

            // create room if not exists
            var members = io.sockets.clients(data.r);
            socket.join(data.r);


            // get members
            for (var i in members) {
                if (members.hasOwnProperty(i)) {
                    userArray.push(members[i].userId);
                }
            }
            // save room and userId in socket object
            socket.room = data.r;
            socket.userId = userCounter++;
            socket.auth = true;

            // return users
            console.log("[register] userId", socket.userId, "room", socket.room);
            callback({success: true, error: null, data: {users: userArray, userId: socket.userId}});
        });

        socket.on('answer', function (data, callback) {
            callback = callback || noop;
            if (validArguments(["userId", "answer"], data)) {
                var forwardSocket = getSocket(socket.room, data.userId);
                if (forwardSocket) {
                    forwardSocket.emit("answer", {
                        userId: socket.userId,
                        answer: data.answer,
                        peer: data.peer
                    });
                    callback({success: true, error: null, data: null});
                } else {
                    callback({success: false, error: "users does not exist", data: null});
                }
            } else {
                callback({success: false, error: "wrong arguments", data: null})
            }
        });

        socket.on('offer', function (data, callback) {
            callback = callback || noop;
            if (validArguments(["userId", "offer"], data)) {
                var forwardSocket = getSocket(socket.room, data.userId);
                if (forwardSocket) {
                    forwardSocket.emit("offer", {
                        userId: socket.userId,
                        offer: data.offer,
                        peer: data.peer
                    });
                    callback({success: true, error: null, data: null});
                } else {
                    callback({success: false, error: "users does not exist", data: null});
                }
            } else {
                callback({success: false, error: "wrong arguments", data: null})
            }
        });

        socket.on('iceCandidate', function (data, callback) {
            callback = callback || noop;
            if (validArguments(["userId", "iceCandidate"], data)) {
                var forwardSocket = getSocket(socket.room, data.userId);
                if (forwardSocket) {
                    forwardSocket.emit("iceCandidate", {
                        userId: socket.userId,
                        iceCandidate: data.iceCandidate
                    });
                    callback({success: true, error: null, data: null});
                } else {
                    callback({success: false, error: "users does not exist", data: null});
                }
            } else {
                callback({success: false, error: "wrong arguments", data: null})
            }
        });

        socket.on('disconnect', function () {
            io.sockets.in(socket.room).emit("userLeave", {userId: socket.userId});
            console.log("[disconnect] userId", socket.userId, "room", socket.room);
        });

        function validArguments(expected, params) {
            if (socket.auth === true && params !== null && typeof params === "object") {
                for (var i in expected) {
                    if (expected.hasOwnProperty(i) && !params.hasOwnProperty(expected[i])) {
                        return false;
                    }
                }
                return true;
            } else {
                return false;
            }
        }

        function getSocket(room, userId) {
            var members = io.sockets.clients(room);
            for (var i in members) {
                if (members.hasOwnProperty(i) && members[i].userId === userId) {
                    return members[i];
                }
            }
            return null;
        }
    });



