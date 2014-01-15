## tiny webRTC


WebRTC is a brand new technology for the Web that allows users to establish a peer-to-peer connection and share video, audio and data. In contrast to previous techniques this allows much higher data speeds without a server in the middle that can easily be a bottleneck for applications with a large number of users.
The area of application for this new technique is significant and reaches from simple chat applications to complex video chat programs with the ability to send files and share the screen.
However it is not an easy way to implement WebRTC for the browser and requieres some server-side work as well to establish the connection. The plugin tiny-webrtc was developed for this purpose and provides a simple API that can be used by virtually anyone.

This Project is still under development and change requests are welcome!

The code is only tested in latest Chrome, since it is used in a Chrome Packaged App.


## Installation

Grab one of the files from the dist folder.

Bower support coming soon!


## Usage

As shown in the sample.html (client/sample.html) you can create a webRTC Object by calling 

``` js
var webRTC = new WebRTC();
```

To listen to events you can hook up some callback functions.

``` js
webRTC.onLoad(function () {}} // called when tiny-webRTC is loaded
webRTC.onInit(function () {}} // called when tiny-webRTC is initialized
webRTC.onScriptLoaded(function () {}} // called when server script is loaded
webRTC.onCameraAccess(function (localStreamURL) {}} // called when camera access is granted
webRTC.onReady(function (userId) {}} // called when script is ready and userId is available
webRTC.onRoomJoin(function (roomNumber) {}} // called when room is joined
webRTC.onUserConnect(function(userId){}) // called when other users connect
webRTC.onUserLeave(function(userId){}) // called when other users leave
webRTC.onData(function(userId, data){}) // called when data is received
webRTC.onError(function(errorId, errorDescription){}) // called when an error occurs
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
webRTC.sendData(userId, data); // send strings
```

## Config Options

You can also pass options as constructor at the beginning.

- **wsServer** String *(default:'http://localhost:8080')* - the address of the server where socket.io is running
- **iceServers** Array *(default:[{"url": "stun:stun.l.google.com:19302"}])* - stun servers to get the best connection between you and your partner. Leave this as is, if you don't know how to create your own.
- **mediaConstraints** Object *(default:{ mandatory: { OfferToReceiveAudio: true, OfferToReceiveVideo: true } })* - list of devices you want to access.
- **roomParamType** String *(default:'hash')* - choose 'hash', 'search', or 'off' to decide how to pass your room number
- **roomParamName** String *(default:'r')* - parameter name to be shown in the address bar
- **autoInit** Boolean *(default:true)* - init automatically or manually
- **room** String/Integer *(default:generated/fetched of url)* - pass a room number on your own
