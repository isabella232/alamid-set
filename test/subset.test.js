"use strict";

var chai = require("chai"),
    sinon = require("sinon"),
    Set = require("../lib/Set.js"),
    subsetPlugin = require("../plugins/subset.js"),
    emitter = require("events").EventEmitter.prototype,
    expect = chai.expect;

chai.use(require("sinon-chai"));

describe("plugins/nodeEvents", function () {

    function SubsetableSet() {
        Set.prototype.constructor.apply(this, arguments);
    }

    before(function () {
        SubsetableSet.prototype = Object.create(Set.prototype);
        SubsetableSet.use = Set.use;
        SubsetableSet.use(subsetPlugin);

        Set.configure({
            emit: emitter.emit,
            on: emitter.on,
            removeListener: emitter.removeListener,
            removeAllListeners: emitter.removeAllListeners
        });
    });

    describe(".prototype", function () {
        var s,
            subset,
            emit,
            event;

        beforeEach(function () {
            s = new SubsetableSet({
                a: "A",
                b: "B",
                c: "C"
            });
        });

        describe(".subset()", function () {

            it("should return a new set", function () {
                expect(s.subset()).to.be.an.instanceof(SubsetableSet);
            });

            it("should use an independent internal object", function () {
                subset = s.subset();
                expect(subset.toObject()).not.to.equal(s.toObject());
            });

            it("should proxy all 'add'- and 'remove'-events", function () {
                subset = s.subset();
                subset.config = Object.create(subset.config);
                subset.config.emit = emit = sinon.spy();

                s.set("d", "D");
                s.remove("c");
                s.set("c", "C");

                expect(emit).to.have.been.calledThrice;

                expect(emit.firstCall).to.have.been.calledWith("add");
                event = emit.firstCall.args[1];
                expect(event).to.eql({
                    name: "add",
                    target: subset,
                    key: "d",
                    element: "D"
                });
                expect(event.target.toObject()[event.key]).to.equal(event.element);

                expect(emit.secondCall).to.have.been.calledWith("remove");
                event = emit.secondCall.args[1];
                expect(event).to.eql({
                    name: "remove",
                    target: subset,
                    key: "c",
                    element: "C"
                });

                expect(emit.thirdCall).to.have.been.calledWith("add");
                event = emit.thirdCall.args[1];
                expect(event).to.eql({
                    name: "add",
                    target: subset,
                    key: "c",
                    element: "C"
                });
                expect(event.target.toObject()[event.key]).to.equal(event.element);
            });

            it("should reflect all changes of the master set", function () {
                subset = s.subset();

                s.set("d", "D");
                s.remove("c");
                s.set("c", "C");
                s.set("a", "a");
                s.remove("b");

                expect(subset.toObject()).to.eql(s.toObject());
            });

            describe(".getMaster()", function () {

                it("should return the master set", function () {
                    subset = s.subset();

                    expect(subset.getMaster()).to.equal(s);
                });

            });

            describe(".set() / .remove()", function () {

                it("should operate on the master", function () {
                    subset = s.subset();

                    subset.set("d", "D");
                    expect(s.toObject().d).to.equal("D");

                    subset.remove("a");
                    expect(s.toObject()).to.not.have.property("a");
                });

            });

            describe(".get() / .has()", function () {

                it("should operate just on the subset", function () {
                    var obj;

                    subset = s.subset();

                    // now we're applying modifications only to the subset
                    // usually you should not do that
                    obj = subset.toObject();

                    obj.a = "aaa";
                    expect(subset.get("a")).to.equal("aaa");
                    expect(s.get("a")).to.equal("A");

                    delete obj.a;
                    expect(subset.has("a")).to.equal(false);
                    expect(s.has("a")).to.equal(true);
                });

            });

            describe(".dispose()", function () {

                it("should remove all event listeners on the master set", function () {
                    var obj;

                    subset = s.subset();
                    subset.config = Object.create(subset.config);
                    subset.config.emit = emit = sinon.spy();
                    obj = subset.toObject();

                    subset.dispose();

                    s.set("d", "D");

                    expect(obj.d).to.equal(undefined);
                    expect(emit).to.not.have.been.called;
                });

                it("should also call Set.prototype.dispose()", function () {
                    var dispose;

                    Set.prototype.dispose = dispose = sinon.spy();
                    s.subset().dispose();

                    expect(dispose).to.have.been.calledOnce;
                });

            });

            describe("when passing a filter", function () {

                function evenOnly(number) {
                    return (number + 1) % 2;
                }

                beforeEach(function () {
                    s = new SubsetableSet({
                        a: 1,
                        b: 2,
                        c: 3,
                        d: 4
                    });
                });

                it("should call the filter with value, key, subset", function () {
                    var filter,
                        obj;

                    obj = s.toObject();

                    delete obj.b;
                    delete obj.c;
                    delete obj.d;

                    subset = s.subset(filter = sinon.spy());
                    s.set("d", 4);

                    expect(filter).to.have.been.calledTwice;

                    expect(filter.firstCall).to.have.been.calledWith(1, "a", subset);
                    expect(filter.secondCall).to.have.been.calledWith(4, "d", subset);
                });

                it("should return a set containing only values that passed the filter", function () {
                    subset = s.subset(evenOnly);

                    expect(subset.toObject()).to.eql({
                        b: 2,
                        d: 4
                    });
                });

                it("should proxy just 'add'- and 'remove'-events of elements that passed the filter", function () {
                    subset = s.subset(evenOnly);
                    subset.config = Object.create(subset.config);
                    subset.config.emit = emit = sinon.spy();

                    s.remove("d");
                    s.set("d", 4);
                    s.remove("c");
                    s.set("c", 3);

                    expect(emit).to.have.been.calledTwice;

                    expect(emit.firstCall).to.have.been.calledWith("remove");
                    event = emit.firstCall.args[1];
                    expect(event).to.eql({
                        name: "remove",
                        target: subset,
                        key: "d",
                        element: 4
                    });

                    expect(emit.secondCall).to.have.been.calledWith("add");
                    event = emit.secondCall.args[1];
                    expect(event).to.eql({
                        name: "add",
                        target: subset,
                        key: "d",
                        element: 4
                    });
                    expect(event.target.toObject()[event.key]).to.equal(event.element);
                });

            });

        });

    });

});
