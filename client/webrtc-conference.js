var WebRTC = (function (opt) {
    "use strict";
    var connected = false,
        localStreamURL,
        localStream,
        peerConnections = {},
        socket,
        cameraAccess = false,
        wsScriptLoaded = false,
        instance = this,
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
            "registration on server failed",
            "could not get socket script",
            "sending offer failed",
            "sending answer failed"
        ];

    var stateChangeCallback = function (a, b) {
        },
        userConnectCallback = function (a) {
        },
        userLeaveCallback = function (a) {
        },
        dataCallback = function (a, b) {
        },
        errorCallback = function (a, b) {
        };

    var config = {
        wsServer: 'http://localhost:8080',  // websocket server
        wsServerScript: '/socket.io/socket.io.js',
        iceServers: [
            {"url": "stun:stun.l.google.com:19302"}
        ],
        mediaConstraints: {
            mandatory: {
                OfferToReceiveAudio: true,
                OfferToReceiveVideo: true
            }
        },
        roomParamType: "hash",
        roomParamName: "r",
        autoInit: true,
        room: generateRoomName()
    };


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
            socket.emit("register", {r: config.room}, function (data) {
                if (data.success) {
                    if (data.data.users.length != 0) {
                        sendOffer(data.data.users);
                    }
                    stateChange(4);
                } else {
                    error(4);
                }
            });
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

    function remove(userId) {
        if (peerConnections[userId]) {
            delete peerConnections[userId];
            userLeaveCallback(userId);

            if (count(peerConnections) === 0) {
                stateChangeCallback(4, "ready - waiting for partners to join");
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
        peerConnections[userId] = (new RTCPeerConnection({iceServers: config.iceServers}, config.mediaConstraints));

        peerConnections[userId].onicecandidate = function (event) {
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
        peerConnections[userId].onconnecting = function () {
        };
        peerConnections[userId].onopen = function () {
        };
        peerConnections[userId].onaddstream = function (event) {
            peerConnections[userId].streamURL = window.URL.createObjectURL(event.stream) || event.stream;
            userConnectCallback(userId);
            if (count(peerConnections) == 1) {
                stateChange(5);
            }
        };
        peerConnections[userId].onremovestream = function () {
            remove(userId);
        };
        peerConnections[userId].addStream(localStream);
        peerConnections[userId].userId = userId;
        peerConnections[userId].streamURL = "";
    }


    function stateChange(new_state) {
        state = new_state;
        stateChangeCallback(state, states[state]);
    }

    function error(state) {
        errorCallback(state, errors[state]);
    }


    instance.init = function () {
        if (!init) {
            init = true;
            stateChange(1);
            setCrossBrowserAPI();
            getScript(config.wsServer + config.wsServerScript);
            onSocketScriptLoad(function () {
                wsScriptLoaded = true;
                stateChange(2);
                getLocalStream(function (localMediaStream) {
                    cameraAccess = true;
                    localStreamURL = window.URL.createObjectURL(localMediaStream) || localMediaStream;
                    localStream = localMediaStream;
                    stateChange(3);
                    setSocketListener();
                });
            });
        }
    };


    instance.onStateChange = function (callback) {
        stateChangeCallback = callback;
    };

    instance.onUserConnect = function (callback) {
        userConnectCallback = callback;
    };

    instance.onUserLeave = function (callback) {
        userLeaveCallback = callback;
    };

    instance.onData = function (callback) {
        dataCallback = callback;
    };

    instance.onError = function (callback) {
        errorCallback = callback;
    };

    instance.getRemoteStream = function (userId) {
        if (peerConnections[userId]) {
            return peerConnections[userId].streamURL;
        } else {
            return "";
        }
    };

    instance.getLocalStream = function () {
        return localStreamURL;
    };

    instance.getState = function () {
        return state;
    };

    instance.getRoom = function () {
        return config.room;
    };

    instance.setConfig = function (opt) {
        if (typeof opt == "object" && opt !== null) {
            for (var i in config) {
                if (config.hasOwnProperty(i) && opt[i] !== undefined)
                    config[i] = opt[i];
            }
        }
    };

    instance.setConfig(opt);

    if (config.autoInit) {
        setTimeout(function () {
            instance.init();
        }, 0);
    }

});
