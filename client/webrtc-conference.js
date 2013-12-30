var WebRTC = (function (opt) {
    "use strict";
    var connected = false,
        localStreamURL,
        myId,
        localStream,
        peerConnections = {},
        socket,
        cameraAccess = false,
        wsScriptLoaded = false,
        self = this,
        state = 0,
        init = false,
        socketScriptTries = 0,
        states = [
            "loaded",
            "init",
            "script loaded",
            "camera/mic access",
            "ready - waiting for partners to join",
            "in videochat"
        ],
        errors = [
            "unknown error",
            "no getUserMedia support on your browser :(",
            "An Error occured while accessing your camera and microphone. Please reload this page",
            "connecting to server failed",
            "joining room on server failed",
            "could not get socket script",
            "sending offer failed",
            "sending answer failed",
            "leaving room on server failed"
        ];

    var events = {
        stateChange: [],
        userConnect: [],
        userLeave: [],
        data: [],
        error: []
    };


    var config = {
        wsServer: 'http://localhost:8080',  // websocket server
        wsServerScript: 'http://localhost:8080/socket.io/socket.io.js',
        iceServers: [
            {"url": "stun:stun.l.google.com:19302"}
        ],
        mediaConstraints: {
            mandatory: {
                OfferToReceiveAudio: true,
                OfferToReceiveVideo: true
            },
            optional: [
                {
                    RtpDataChannels: true
                }
            ]
        },
        roomParamType: "hash",
        roomParamName: "r",
        autoInit: true,
        autoJoinRoom: true,
        room: generateRoomName()
    };


    function dispatchEvent(name, param1, param2){
         for(var i in events[name]){
             if(events[name].hasOwnProperty(i) && typeof events[name][i] == "function"){
                 events[name][i](param1, param2);
             }
         }
    }

    function getURLParameter(name) {
        var a = new RegExp(name + '=' + '(.+?)(&|$)').exec(location[config.roomParamType]);
        return a ? decodeURI(a[1]) : a;
    }

    function setSocketListener() {
        socket = io.connect(config.wsServer);
        setTimeout(function () {
            if (!connected)
                error(3);
        }, 5000);
        socket.on("connect", function () {
            connected = true;
            var register = {};
            var pRoom = getURLParameter(config.roomParamName);
            if (pRoom) {
                config.room = pRoom;
            }
            if (config.autoJoinRoom) {
                joinRoom();
            }
        });

        socket.on("offer", function (data) {
            addPeerConnection(data.userId);
            peerConnections[data.userId].setRemoteDescription(new RTCSessionDescription(data.offer));
            peerConnections[data.userId].createAnswer(function (sessionDescription) {
                peerConnections[data.userId].setLocalDescription(sessionDescription);
                socket.emit("answer", {
                    userId: data.userId,
                    answer: sessionDescription
                }, function (re) {
                    if (!re.success)
                        error(7);
                });
            }, null, config.mediaConstraints);
        });


        socket.on("answer", function (data) {
            peerConnections[data.userId].setRemoteDescription(new RTCSessionDescription(data.answer));
        });


        socket.on("iceCandidate", function (data) {
            peerConnections[data.userId].addIceCandidate(new RTCIceCandidate({sdpMLineIndex: data.iceCandidate.label,
                candidate: data.iceCandidate.candidate}));
        });


        socket.on("userLeave", function (data) {
            remove(data.userId);
        });
    }

    function joinRoom() {
        socket.emit("joinRoom", {room: config.room}, function (data) {
            if (data.success) {
                if (data.data.users.length != 0) {
                    sendOffer(data.data.users);
                    myId = data.data.userId;
                }
                stateChange(4);
            } else {
                error(4);
            }
        });
    }

    function remove(userId) {
        if (peerConnections[userId]) {
            delete peerConnections[userId];
            dispatchEvent("userLeave", userId);

            if (count(peerConnections) === 0) {
                stateChange(4);

            }
        }
    }

    function sendOffer(users) {
        for (var i in users) {
            if (users.hasOwnProperty(i))
                sendOfferToUser(users[i]);
        }
    }

    function sendOfferToUser(userId) {
        addPeerConnection(userId);
        peerConnections[userId].createOffer(function (sessionDescription) {
            socket.emit("offer", {
                userId: userId,
                offer: sessionDescription
            }, function (re) {
                if (!re.success) {
                    error(6);
                }
            });
            peerConnections[userId].setLocalDescription(sessionDescription);
        }, null, config.mediaConstraints);
    }

    function count(obj) {
        var c = 0;
        for (var i in obj) {
            if (obj.hasOwnProperty(i))
                c++;
        }
        return c;
    }

    function generateRoomName() {
        return Math.floor(Math.random() * 999999);
    }


    function setCrossBrowserAPI() {
        window.navigator.getUserMedia = window.navigator.getUserMedia || window.navigator.webkitGetUserMedia || window.navigator.mozGetUserMedia || window.navigator.msGetUserMedia;
        window.URL = window.URL || window.webkitURL || window.mozURL || window.msURL;
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        window.RTCPeerConnection = window.webkitRTCPeerConnection || window.mozRTCPeerConnection
    }

    function getScript(url) {
        var script = document.createElement('script');
        script.src = url;
        document.getElementsByTagName('head')[0].appendChild(script);
    }

    function onSocketScriptLoad(callback) {
        socketScriptTries++;
        if (socketScriptTries > 50) {
            error(5);
        } else if (window.io === undefined) {
            setTimeout(function () {
                onSocketScriptLoad(callback);
            }, 100)
        } else {
            callback();
        }
    }

    function getLocalStream(callback) {
        if (navigator.getUserMedia) {
            var channels = {video: true, audio: true};
            navigator.getUserMedia(channels, callback, function () {
                error(2);
            });
        } else {
            error(1);
        }
    }

    function addPeerConnection(userId) {
        var pc = new RTCPeerConnection({iceServers: config.iceServers}, config.mediaConstraints);
        pc = new RTCPeerConnection({iceServers: config.iceServers}, config.mediaConstraints);

        pc.onicecandidate = function (event) {
            if (event.candidate) {
                socket.emit("iceCandidate",
                    {
                        iceCandidate: {
                            type: 'candidate',
                            label: event.candidate.sdpMLineIndex,
                            id: event.candidate.sdpMid,
                            candidate: event.candidate.candidate
                        },
                        userId: userId
                    });
            }
        };
        pc.onconnecting = function () {
        };
        pc.onopen = function () {
        };
        pc.onaddstream = function (event) {
            pc.streamURL = getStreamUrl(event.stream);
            pc.stream = event.stream;
            dispatchEvent("userConnect", userId);
            if (count(peerConnections) == 1) {
                stateChange(5);
            }
        };
        pc.onremovestream = function () {
            remove(userId);
        };
        pc.ondatachannel = function (event) {
            var receiveChannel = event.channel;
            receiveChannel.onmessage = function (event) {

            };
        };

        pc.addStream(localStream);
        pc.streamURL = "";
        pc.stream = "";
        pc.RTCDataChannel = pc.createDataChannel("RTCDataChannel", {reliable: false});

        pc.RTCDataChannel.onmessage = function (event) {
            dispatchEvent('data',userId, JSON.parse(event.data));
        };

        peerConnections[userId] = pc;
    }

    function getStreamUrl(stream) {
        var url;
        try {
            url = window.URL.createObjectURL(stream) || stream;
        } catch (e) {
            url = stream;
        }
        return url;
    }

    function stateChange(new_state) {
        state = new_state;
        dispatchEvent('stateChange', state, states[state]);
    }

    function error(state) {
        dispatchEvent('error', state, errors[state]);
    }


    self.init = function () {
        if (!init) {
            init = true;
            stateChange(1);
            setCrossBrowserAPI();
            getScript(config.wsServerScript);
            onSocketScriptLoad(function () {
                wsScriptLoaded = true;
                stateChange(2);
                getLocalStream(function (localMediaStream) {
                    cameraAccess = true;
                    localStreamURL = getStreamUrl(localMediaStream);
                    localStream = localMediaStream;
                    stateChange(3);
                    setSocketListener();
                });
            });
        }
    };


    self.onStateChange = function (callback) {
        events.stateChange.push(callback);
    };

    self.onUserConnect = function (callback) {
        events.userConnect.push(callback);
    };

    self.onUserLeave = function (callback) {
        events.userLeave.push(callback);
    };

    self.onData = function (callback) {
        events.data.push(callback);
    };

    self.onError = function (callback) {
        events.error.push(callback);
    };

    self.getRemoteStream = function (userId) {
        if (peerConnections[userId]) {
            return peerConnections[userId].streamURL;
        } else {
            return "";
        }
    };

    self.getLocalStream = function () {
        return localStreamURL;
    };

    self.getState = function () {
        return state;
    };

    self.joinRoom = function (room) {
        config.room = room;
        joinRoom();
    };

    self.leaveRoom = function () {
        for (var i in peerConnections) {
            if (peerConnections.hasOwnProperty(i))
                peerConnections[i].stream.stop();
        }
        socket.emit("leaveRoom", null, function (data) {
            if (data.success) {
                config.room = null;
            } else {
                error(8);
            }
        });
    };

    self.getRoom = function () {
        return config.room;
    };

    self.sendData = function (userId, data) {
        if (peerConnections[userId]) {
            if (peerConnections[userId].RTCDataChannel.readyState == "open") {
                peerConnections[userId].RTCDataChannel.send(data);
            } else {
                setTimeout(function () {
                    self.sendData(userId, JSON.stringify(data));
                }, 100)
            }
        }
    };

    self.getMyId = function(){
        return myId;
    };

    self.setConfig = function (opt) {
        if (typeof opt == "object" && opt !== null) {
            for (var i in config) {
                if (config.hasOwnProperty(i) && opt[i] !== undefined)
                    config[i] = opt[i];
            }
        }
    };



    self.setConfig(opt);

    if (config.autoInit) {
        setTimeout(function () {
            self.init();
        }, 0);
    }

});
