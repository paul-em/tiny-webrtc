describe("Client", function () {
    beforeEach(function () {

    });

    describe("constructor", function () {
        var webRTC;
        it("should overwrite the settings and not init automatically", function () {
            webRTC = new WebRTC({room: "myRoom", autoInit: false});
            expect(webRTC.getRoom()).toBe("myRoom");
            expect(webRTC.getState()).toBe(0);
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


        var state = 0;
        webRTC.onStateChange(function (s) {
            state = s;
        });

        it('should set init state', function () {
            waitsFor(function () {
                return state === 1;
            }, "it should auto init", 1000);

            runs(function () {
                expect(webRTC.getState()).toBe(1);
            })
        });

        it('should set socket script loaded state', function () {

            waitsFor(function () {
                return state === 2;
            }, "it should be able to load the socket script", 3000);

            runs(function () {
                expect(webRTC.getState()).toBe(2);
            })
        });

        it('should access (mocked) camera', function () {
            waitsFor(function () {
                return state === 3;
            }, "it should call camera", 10000);

            runs(function () {
                expect(webRTC.getState()).toBe(3);
                expect(access).toBeTruthy();
            })
        });

        it('should automatically join room', function () {
            waitsFor(function () {
                return state === 4;
            }, "it switch state to 4", 10000);

            runs(function () {
                expect(webRTC.getState()).toBe(4);
                expect(webRTC.getRoom()).toBeDefined();
            })
        });
    })
});