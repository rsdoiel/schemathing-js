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
var 	path = require('path'),
	assert = require('assert'),
	schema = require('./schemathing');

// Examples to play with
var 	aThing, aClonedThing, 
	aThingLikeObject = {
		description: "A plain old JavaScript object.",
		image: "http://example.com/a-plain-js-object.jpg",
		name: 'aThingLikeObject',
		url: "http://example.com/a-plain-js-object.json"
	};


console.log("Starting [" + path.basename(process.argv[1]) + "] ...");
// Creating an empty thing
aThing = schema.Thing.create({_id:1});
assert.strictEqual(aThing._id, 1, "aThing._id === 1");
// Should return false since aThing has nothing in common with aThingLikeObject
assert.ok(aThing.equal(aThingLikeObject),"aThing == aThingLikeObject" );
// Merging aThingLikeObject
aThing.strictMerge(aThingLikeObject)
assert.ok(aThing.equal(aThingLikeObject),"aThing == aThingLikeObject");
assert.ok(! aThing.strictEqual(aThingLikeObject),"aThing === aThingLikeObject");
// Cloning, aClonedThing should have _id: 2
aClonedThing = aThing.clone();
assert.strictEqual(aClonedThing._id, 2, "aClonedThing should have an id: 2");
// Should be true because everything in common is equal
assert.ok(aThing.equal(aThingLikeObject),"aClonedThing == aThingLikeObject");
// Should be false because aThingLikeObject._id is missing
assert.ok(aThing.strictEqual(aThingLikeObject),"aClonedThing === aThingLikeObject");
// Should be true because all the fields, except _id are in common
assert.ok(aClonedThing.equal(aThing),"aClonedThing == aThing");
// Should be false since the _id is different
assert.ok(aClonedThing.strictEqual(aThing),"aClonedThing === aThing");


console.log("Success! [" + path.basename(process.argv[1]) + "]");