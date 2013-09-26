"use strict";

var chai = require("chai"),
    sinon = require("sinon"),
    Set = require("../lib/Set.js"),
    nodeEvents = require("../plugins/nodeEvents.js"),
    emitter = require("events").EventEmitter.prototype,
    expect = chai.expect;

chai.use(require("sinon-chai"));

describe("plugins/nodeEvents", function () {
    var s;

    function MySet() {
        Set.apply(this, arguments);
    }

    before(function () {
        MySet.prototype = Object.create(Set.prototype);
        MySet.use = Set.use;
        MySet.use(nodeEvents);
    });

    beforeEach(function () {
        s = new MySet();
    });

    it("should adjust the config", function () {
        expect(s.config.emit).to.equal(emitter.emit);
        expect(s.config.on).to.equal(emitter.on);
        expect(s.config.removeListener).to.equal(emitter.removeListener);
        expect(s.config.removeAllListeners).to.equal(emitter.removeAllListeners);
    });

    it("should enable working with node's EventEmitter", function () {
        var listener = sinon.spy();

        expect(s.on).to.be.a("function");
        expect(s.removeListener).to.be.a("function");

        s.on("add", listener);
        s.set("greeting", "hi");
        expect(listener).to.have.been.calledOnce;

        s.removeListener("add", listener);
        s.set("greeting", "ahoi");
        expect(listener).to.have.been.calledOnce;
    });

    it("should throw an error if the target api clashes with the EventEmitter api", function () {
        function WontWork() {}

        WontWork.prototype = Object.create(Set.prototype);
        WontWork.prototype.on = function () {};
        WontWork.use = Set.use;

        expect(function () {
            WontWork.use(nodeEvents);
        }).to.throw(Error, "There is already a 'on'-property defined");
    });

});