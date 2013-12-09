## tiny webRTC


WebRTC is (or should be) native in modern browsers. SO why would an API Wrap need tons of depenedencies?

The aim of this project is, to offer a lightweight wrapper for the WebRTC API. It also offers the code for the webserver to establish the initial peer2peer connection.

This Project is still under development and change requests are welcome!

## Usage

As shown in the sample.html (client/sample.html) you can create a webRTC Object by calling 

``` js
var webRTC = new WebRTC();
```

To listen to events you can hook up some callback functions.

``` js
webRTC.onStateChange(function(state, stateDescription){})
webRTC.onUserConnect(function(userId){})
webRTC.onUserLeave(function(userId){})
webRTC.onData(function(userId, data){})
webRTC.onError(function(errorId, errorDescription){})
```

available API calls are

``` js
webRTC.init(); // init manually if autoInit set to false
webRTC.getRemoteStream(userId); // returns URL for remote Stream - just set this as src for your video element
webRTC.getLocalStream(); // returns URL for local Stream - just set this as src for your video element
webRTC.getState(); // returns current state
webRTC.joinRoom(room); // joins any room (string or int) and leaves previous rooms
webRTC.leaveRoom(); // leave current room and stop remoteStreams
webRTC.getRoom(); // returns current room name
webRTC.setConfig(opt); // set config like in constructor
```

## Config Options

You can also pass options as constructor at the beginning.

- **wsServer** String *(default:'http://localhost:8080')* - the address of the server where socket.io is running
- **wsServerScript** String *(default:'/socket.io/socket.io.js')* - the path to the socket script. Usually you can leave this as is.
- **iceServers** Arraz *(default:[{"url": "stun:stun.l.google.com:19302"}])* - stun servers to get the best connection between you and your partner. Leave this as is, if you don't know how to create your own.
- **mediaConstraints** Object *(default:{ mandatory: { OfferToReceiveAudio: true, OfferToReceiveVideo: true } })* - list of devices you want to access.
- **roomParamType** String *(default:'hash')* - choose 'hash', 'search', or 'off' to decide how to pass your room number
- **roomParamName** String *(default:'r')* - parameter name to be shown in the address bar
- **autoInit** Boolean *(default:true)* - init automatically or manually
- **room** String/Integer *(default:generated/fetched of url)* - pass a room number on your own

## States

- **0** *loaded*
- **1** *init*
- **2** *script loaded*
- **3** *camera/mic access*
- **4** *ready - waiting for partners to join*
- **5** *in videochat*
