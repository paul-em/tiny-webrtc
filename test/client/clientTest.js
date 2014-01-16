describe("Client", function () {
    beforeEach(function () {

    });

    describe("constructor", function () {
        var webRTC;
        it("should overwrite the settings and not init automatically", function () {
            webRTC = new WebRTC({room: "myRoom", autoInit: false});
            expect(webRTC.getRoom()).toBe("myRoom");
        });

        it("should overwrite the settings again", function () {
            webRTC.setConfig({room: "myRoom2"});
            expect(webRTC.getRoom()).toBe("myRoom2");
        });
    });

    describe("init", function () {

        var webRTC = new WebRTC();
        var access = false;
        window.navigator.getUserMedia = function (data, success, fail) {
            setTimeout(function () {
                access = true;
                success("streamMock");
            }, 400)
        };

        var load = false;
        webRTC.onLoad(function(){
            load = true;
        });

        var init = false;
        webRTC.onInit(function(){
            init = true;
        });

        var scriptLoaded = false;
        webRTC.onLoad(function(){
            scriptLoaded = true;
        });

        var cameraAccess = false;
        webRTC.onCameraAccess(function(){
           cameraAccess = true;
        });

        var ready = false;
        webRTC.onConnect(function(){
            ready = true;
        });

        var roomJoin = false;
        webRTC.onRoomJoin(function(){
            roomJoin = true;
        });

        it('should set load state', function () {
            waitsFor(function () {
                return load;
            }, "it should be able to load the socket script", 3000);
        });

        it('should set init state', function () {
            waitsFor(function () {
                return init;
            }, "it should auto init", 1000);
        });

        it('should set socket script loaded state', function () {
            waitsFor(function () {
                return scriptLoaded;
            }, "it should be able to load the socket script", 3000);
        });

        it('should access (mocked) camera', function () {
            waitsFor(function () {
                return cameraAccess;
            }, "it should call camera", 10000);

            runs(function () {
                expect(access).toBeTruthy();
            })
        });

        it('should join room and return value', function () {
            waitsFor(function () {
                return roomJoin;
            }, "it should join room", 10000);

            runs(function () {
                expect(webRTC.getRoom()).toBeDefined();
            })
        });
    })
});