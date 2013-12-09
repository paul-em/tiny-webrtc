describe("Server", function () {
    var socket, userId;

    beforeEach(function () {
        var done = false;

        runs(function () {
            if (!socket || !socket.socket.connected) {
                socket = io.connect('http://localhost:8080', {
                    'reconnection delay': 0, 'reopen delay': 0, 'force new connection': true
                });
                socket.on('connect', function () {
                    done = true;
                });
                socket.on('disconnect', function () {
                })
            } else {
                done = true;
            }
        });

        waitsFor(function () {
            return done;
        }, "it should be connected", 3000);
    });

    describe("joinRoom", function () {
        it("should tell me is should enter room first", function () {
            var done = false;
            runs(function () {
                socket.emit("offer", {userId: 99999, offer: {offer: 1}}, function (data) {
                    done = true;
                    expect(data.success).toBeFalsy();
                    expect(data.error).toBe("no room selected");
                    expect(data.data).toBeNull();
                })
            });

            waitsFor(function () {
                return done;
            }, "it should callback a response", 3000);
        });

        it("should tell me there is missing room param", function () {
            var done = false;
            runs(function () {
                socket.emit("joinRoom", {}, function (data) {
                    done = true;
                    expect(data.success).toBeFalsy();
                    expect(data.error).toBe("wrong arguments");
                    expect(data.data).toBeNull();
                })
            });

            waitsFor(function () {
                return done;
            }, "it should callback a response", 3000);
        });


        it("should join my room and tell me there are no users in the room", function () {
            var done = false;
            runs(function () {
                socket.emit("joinRoom", {room: "testRoom1"}, function (data) {
                    done = true;
                    expect(data.success).toBeTruthy();
                    expect(data.error).toBeNull();
                    expect(data.data.users).toBeDefined();
                    expect(data.data.users.length).toEqual(0);
                    expect(data.data.userId).toBeDefined();
                    userId = data.data.userId;
                });
            });

            waitsFor(function () {
                return done;
            }, "it should callback a response", 3000);
        });
    });

    describe("answer", function () {
        it("should fail and inform me of missing arguments", function () {
            var done = false;
            runs(function () {
                socket.emit("answer", null, function (data) {
                    done = true;
                    expect(data.success).toBeFalsy();
                    expect(data.error).toBe("wrong arguments");
                    expect(data.data).toBeNull();
                });
            });

            waitsFor(function () {
                return done;
            }, "it should callback a response", 3000);
        });

        it("should inform me, that user is gone", function () {
            var done = false;
            runs(function () {
                socket.emit("answer", {userId: 99999, answer: {offer: 1}}, function (data) {
                    done = true;
                    expect(data.success).toBeFalsy();
                    expect(data.error).toBe("users does not exist");
                });
            });

            waitsFor(function () {
                return done;
            }, "it should callback a response", 3000);
        });

        it("should tell me the call was successful", function () {
            var done = false;
            runs(function () {
                socket.on("answer", function(data){
                    done++;
                    expect(data.userId).toBe(userId);
                    expect(data.answer.answer).toBe(1);
                });

                socket.emit("answer", {userId: userId, answer: {answer: 1}}, function (data) {
                    console.log(data);
                    done++;
                    expect(data.success).toBeTruthy();
                    expect(data.error).toBeNull();
                });
            });

            waitsFor(function () {
                return done >= 2;
            }, "it should callback a response", 3000);
        });
    });

    describe("offer", function () {
        it("should fail and inform me of missing arguments", function () {
            var done = false;
            runs(function () {
                socket.emit("offer", null, function (data) {
                    done = true;
                    expect(data.success).toBeFalsy();
                    expect(data.error).toBe("wrong arguments");
                    expect(data.data).toBeNull();
                });
            });

            waitsFor(function () {
                return done;
            }, "it should callback a response", 3000);
        });

        it("should inform me, that user is gone", function () {
            var done = false;
            runs(function () {
                socket.emit("offer", {userId: 99999, offer: {offer: 1}}, function (data) {
                    done = true;
                    expect(data.success).toBeFalsy();
                    expect(data.error).toBe("users does not exist");
                });
            });

            waitsFor(function () {
                return done;
            }, "it should callback a response", 3000);
        });

        it("should tell me the call was successful", function () {
            var done = false;
            runs(function () {
                socket.on("offer", function(data){
                    done++;
                    expect(data.userId).toBe(userId);
                    expect(data.offer.offer).toBe(1);
                });

                socket.emit("offer", {userId: userId, offer: {offer: 1}}, function (data) {
                    done++;
                    expect(data.success).toBeTruthy();
                    expect(data.error).toBeNull();
                });
            });

            waitsFor(function () {
                return done >= 2;
            }, "it should callback a response", 3000);
        });
    });


    describe("iceCandidate", function () {
        it("should fail and inform me of missing arguments", function () {
            var done = false;
            runs(function () {
                socket.emit("iceCandidate", null, function (data) {
                    done = true;
                    expect(data.success).toBeFalsy();
                    expect(data.error).toBe("wrong arguments");
                    expect(data.data).toBeNull();
                });
            });

            waitsFor(function () {
                return done;
            }, "it should callback a response", 3000);
        });

        it("should inform me, that user is gone", function () {
            var done = false;
            runs(function () {
                socket.emit("iceCandidate", {userId: 99999, iceCandidate: {a:1}}, function (data) {
                    done = true;
                    expect(data.success).toBeFalsy();
                    expect(data.error).toBe("users does not exist");
                });
            });

            waitsFor(function () {
                return done;
            }, "it should callback a response", 3000);
        });

        it("should tell me the call was successful", function () {
            var done = 0;
            runs(function () {

                socket.on("iceCandidate", function(data){
                    done++;
                    expect(data.userId).toBe(userId);
                    expect(data.iceCandidate.a).toBe(1);
                });

                socket.emit("iceCandidate", {userId: userId, iceCandidate: {a:1}}, function (data) {
                    done++;
                    expect(data.success).toBeTruthy();
                    expect(data.error).toBeNull();
                });
            });

            waitsFor(function () {
                return done >= 2;
            }, "it should callback a response", 3000);
        });
    });

    describe("leaveRoom", function () {
        it("should successfully leave room", function () {
            var done = false;
            runs(function () {
                socket.emit("leaveRoom", null, function (data) {
                    done = true;
                    expect(data.success).toBeTruthy();
                    expect(data.error).toBeNull();
                });
            });

            waitsFor(function () {
                return done;
            }, "it should callback a response", 3000);
        });

        it("should tell me is should enter room first", function () {
            var done = false;
            runs(function () {
                socket.emit("offer", {userId: userId, offer: {offer: 1}}, function (data) {
                    done = true;
                    expect(data.success).toBeFalsy();
                    expect(data.error).toBe("no room selected");
                    expect(data.data).toBeNull();
                })
            });

            waitsFor(function () {
                return done;
            }, "it should callback a response", 3000);
        });

        it("should join my room and tell me there are no users in the room", function () {
            var done = false;
            runs(function () {
                socket.emit("joinRoom", {room: "testRoom1"}, function (data) {
                    done = true;
                    expect(data.success).toBeTruthy();
                    expect(data.error).toBeNull();
                    expect(data.data.users).toBeDefined();
                    expect(data.data.users.length).toEqual(0);
                    expect(data.data.userId).toBeDefined();
                    userId = data.data.userId;
                });
            });

            waitsFor(function () {
                return done;
            }, "it should callback a response", 3000);
        });
    });
});