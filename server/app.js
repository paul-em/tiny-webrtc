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
var roomLimit = 5;
var noop = function () {
};

io.sockets.on('connection',
    function (socket) {
        socket.userId = userCounter++;

        var $emit = socket.$emit;
        socket.$emit = function () {
            var fn = arguments[0];
            console.log('-->[' + fn + ']', arguments[1]);
            var cb = arguments[2] || noop;

            arguments[2] = function (data) {
                console.log('<--[' + fn + ']', data);
                cb(data);
            };
            $emit.apply(socket, arguments);
        };

        socket.on('getUserId', function(data, callback){
            callback = callback || noop;
            callback({success: true, error: null, data: {userId: socket.userId}});

        });

        socket.on('joinRoom', function (data, callback) {
            callback = callback || noop;
            if (data.room === undefined) {
                callback({success: false, error: "wrong arguments", data: null});
                return;
            }

            if(socket.room){
                leaveRoom();
            }

            var userArray = [];

            // create room if not exists
            var members = io.sockets.clients(data.room);
            if(members.length >= roomLimit){
                callback({success:false, error: "room full", data: null});
                return;
            }
            socket.join(data.room);

            // get members
            for (var i in members) {
                if (members.hasOwnProperty(i)) {
                    userArray.push(members[i].userId);
                }
            }
            // save room and userId in socket object
            socket.room = data.room;

            // return users
            callback({success: true, error: null, data: {users: userArray}});
        });

        socket.on('leaveRoom', function (data, callback) {
            callback = callback || noop;
            leaveRoom();
            callback({success: true, error: null, data: null});
        });


        socket.on('answer', function (data, callback) {
            callback = callback || noop;
            if (socket.room === undefined) {
                callback({success: false, error: "no room selected", data: null});
            } else if (validArguments(["userId", "answer"], data)) {
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
            if (socket.room === undefined) {
                callback({success: false, error: "no room selected", data: null});
            } else if (validArguments(["userId", "offer"], data)) {
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
            if (socket.room === undefined) {
                callback({success: false, error: "no room selected", data: null});
            } else if (validArguments(["userId", "iceCandidate"], data)) {
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
            leaveRoom();
        });

        function leaveRoom(){
            socket.leave(socket.room);
            io.sockets.in(socket.room).emit("userLeave", {userId: socket.userId});
            socket.room = undefined;
        }

        function validArguments(expected, params) {
            if (params !== null && typeof params === "object") {
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



