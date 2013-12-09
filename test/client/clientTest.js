describe("Client", function () {
    var webRTC;

    beforeEach(function () {
    });

    describe("constructor", function () {
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
        it('should get access to user media', function () {
            webRTC = new WebRTC();
            var changed = false;
            webRTC.onStateChange(function(){
                changed = true;
            });

            waitsFor(function(){
                return changed;
            }, "it should auto init", 1000);

            runs(function(){
                expect(webRTC.getState()).toBe(1);
            })
        });
    })
});