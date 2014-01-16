var WebRTC = (function (opt) {
  "use strict";
  var connected = false,
    localStreamURL,
    myId,
    localStream,
    peerConnections = {},
    socket,
    cameraAccess = false,
    self = this,
    init = false;

  var events = {
    load: [],
    init: [],
    scriptLoaded: [],
    cameraAccess: [],
    connect: [],
    roomJoin: [],
    userConnect: [],
    userLeave: [],
    data: [],
    error: []
  };


  var config = {
    wsServer: 'http://localhost:8080',  // websocket server
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


  function dispatchEvent(name, param1, param2) {
    for (var i in events[name]) {
      if (events[name].hasOwnProperty(i) && typeof events[name][i] == "function") {
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
        dispatchEvent('error',"connecting to server failed");
    }, 5000);
    socket.on("connect", function () {
      connected = true;
      var pRoom = getURLParameter(config.roomParamName);
      if (pRoom) {
        config.room = pRoom;
      }
      socket.emit("getUserId", {}, function (data) {
        if (data.success) {
          myId = data.data.userId;
          dispatchEvent("connect", myId);
          if (config.autoJoinRoom) {
            joinRoom();
          }
        } else {
          dispatchEvent('error',"getting userId failed");
        }
      })
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
            dispatchEvent('error',"sending answer failed");
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
        }
        dispatchEvent("roomJoin", config.room);
      } else {
        if (data.error == "room full") {
          dispatchEvent('error',"room limit reached");
        } else {
          dispatchEvent('error',"joining room on server failed");
        }
      }
    });
  }

  function remove(userId) {
    if (peerConnections[userId]) {
      delete peerConnections[userId];
      dispatchEvent("userLeave", userId);
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
          dispatchEvent('error',"sending answer failed");
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

  function getLocalStream(callback) {
    if (navigator.getUserMedia) {
      var channels = {video: true, audio: true};
      navigator.getUserMedia(channels, callback, function () {
        dispatchEvent('error',"An Error occured while accessing your camera and microphone. Please reload this page");
      });
    } else {
      dispatchEvent('error',"no getUserMedia support on your browser :(");
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
      var data = decodeURI(event.data);
      try {
        data = JSON.parse(data);
      } catch (e) {

      }
      dispatchEvent('data', userId, data);
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

  self.init = function () {
    if (!init) {
      init = true;
      dispatchEvent("init");
      setCrossBrowserAPI();
      getLocalStream(function (localMediaStream) {
        cameraAccess = true;
        localStreamURL = getStreamUrl(localMediaStream);
        localStream = localMediaStream;
        dispatchEvent("cameraAccess", localStreamURL);
        setSocketListener();
      });

    }
  };


  // Event listener

  self.onLoad = function (callback) {
    events.load.push(callback);
  };

  self.onInit = function (callback) {
    events.init.push(callback);
  };

  self.onCameraAccess = function (callback) {
    events.cameraAccess.push(callback);
  };

  self.onConnect = function (callback) {
    events.connect.push(callback);
  };

  self.onRoomJoin = function (callback) {
    events.roomJoin.push(callback);
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
        dispatchEvent('error',"leaving room on server failed");
      }
    });
  };

  self.getRoom = function () {
    return config.room;
  };

  self.sendData = function (userId, data) {
    if (peerConnections[userId]) {
      if (peerConnections[userId].RTCDataChannel.readyState == "open") {
        if (typeof data == "object") {
          data = JSON.stringify(data);
        }
        data = encodeURI(data);
        peerConnections[userId].RTCDataChannel.send(data);
      } else {
        setTimeout(function () {
          self.sendData(userId, data);
        }, 100)
      }
    }
  };

  self.sendDataAll = function (data) {
    for (var i in peerConnections) {
      if (peerConnections.hasOwnProperty(i))
        self.sendData(i, data);
    }
  };

  self.getMyId = function () {
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
  setTimeout(function () {
    dispatchEvent("load");
  }, 0);
  if (config.autoInit) {
    setTimeout(function () {
      self.init();
    }, 0);
  }

});
