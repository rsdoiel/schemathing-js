//
// schemathing_test.js - test to explore how schemathing.js should work.
//
// @author: R. S. Doiel, <rsdoiel@gmail.com>
// copyright (c) 2011 all rights reserved
//
// Released under New the BSD License.
// See: http://opensource.org/licenses/bsd-license.php
//
// revision: 0.0.1-experiment
//
var util = require('util'),
    path = require('path'),
	assert = require('assert'),
	schema = require('./schemathing');

// Examples to play with
var aThing, aClonedThing, 
	aThingLikeObject = {
		description: "A plain old JavaScript object.",
		image: "http://example.com/a-plain-js-object.jpg",
		name: 'aThingLikeObject',
		url: "http://example.com/a-plain-js-object.json"
	};


console.log("Starting [" + path.basename(process.argv[1]) + "] ...");
// Creating an empty thing
aThing = schema.Thing.create();
// FIXME: want to replace _id with something more Mongo like for object id.
assert.strictEqual(aThing._id, 1, "aThing._id === 1");
// Should return false since aThing has nothing in common with aThingLikeObject
assert.ok(! aThing.equal(aThingLikeObject),"should fail, aThing == aThingLikeObject: " + aThing.equal(aThingLikeObject));
assert.ok(! aThing.strictEqual(aThingLikeObject),"should fail, aThing === aThingLikeObject" );
assert.ok(aThing.notEqual(aThingLikeObject),"aThing != aThingLikeObject: " + aThing.notEqual(aThingLikeObject));
assert.ok(aThing.notStrictEqual(aThingLikeObject),"aThing !== aThingLikeObject" );

// morph <- update and aquire another object's properties, except _id
aThing.morph(aThingLikeObject);
assert.ok(aThing.equal(aThingLikeObject), "aThing == aThingLikeObject");//JSON.stringify(aThing) + " == " +JSON.stringify(aThingLikeObject));
assert.ok(aThing.strictEqual(aThingLikeObject),"aThing === aThingLikeObject");
// Cloning, aClonedThing should have _id: 2
aClonedThing = aThing.clone();
assert.strictEqual(aClonedThing._id, 2, "aClonedThing should have an id: 2 " + util.inspect(aClonedThing));
// Should be true because everything in common is equal
assert.ok(aThing.equal(aThingLikeObject),"aClonedThing == aThingLikeObject");
// Should be false because aThingLikeObject._id is missing
assert.ok(aThing.strictEqual(aThingLikeObject),"aClonedThing === aThingLikeObject");
// Should be true because all the fields, except _id are in common
assert.ok(aClonedThing.equal(aThing),"aClonedThing == aThing");
// Should be false since the _id is different
assert.ok(aClonedThing.strictEqual(aThing),"aClonedThing === aThing");


console.log("Success! [" + path.basename(process.argv[1]) + "]");
