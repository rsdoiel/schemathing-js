//
// schemathing_test.js - test to explore how schemathing.js should work.
//
// @author: R. S. Doiel, <rsdoiel@gmail.com>
// copyright (c) 2011 all rights reserved
//
// Released under New the BSD License.
// See: http://opensource.org/licenses/bsd-license.php
//
// revision: 0.0.0c-experiment
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
	},
	anotherObject = {
		car:2,
		house:"blue",
		market:"hopscocht"
	};


console.log("Starting [" + path.basename(process.argv[1]) + "] ...");
// Creating an empty thing
aThing = schema.Thing.create();
// FIXME: want to replace _id with something more Mongo like for object id.
assert.strictEqual(aThing._id, 1, "aThing._id === 1");
// Should return false since aThing has nothing in common with aThingLikeObject
assert.ok(! aThing.equal(aThingLikeObject),"should fail, aThing == aThingLikeObject: " + aThing.equal(aThingLikeObject));
assert.ok(! aThing.equal(anotherObject), "should fail, aThing == anotherObject");
assert.ok(! aThing.strictEqual(aThingLikeObject),"should fail, aThing === aThingLikeObject" );
assert.ok(! aThing.strictEqual(anotherObject),"should fail, aThing === anotherObject" );
assert.ok(aThing.notEqual(aThingLikeObject),"aThing != aThingLikeObject: " + aThing.notEqual(aThingLikeObject));
assert.ok(aThing.notStrictEqual(aThingLikeObject),"aThing !== aThingLikeObject" );
assert.ok(aThing.notEqual(anotherObject),"aThing != anotherObject: " + aThing.notEqual(anotherObject));
assert.ok(aThing.notStrictEqual(anotherObject),"aThing !== anotherObject" );

// morph <- update existing properties and aquire another object's properties, except _id
aThing.morph(aThingLikeObject);
assert.ok(aThing.equal(aThingLikeObject), "aThing == aThingLikeObject");
assert.ok(! aThing.strictEqual(anotherObject),"should fail, aThing === anotherObject");
assert.ok(! aThing.equal(anotherObject), "should fail, aThing == anotherObject");
assert.strictEqual(aThing.isSimilar(aThingLikeObject), true, "aThing.isSimilar(aThingLikeObject) === true");
assert.strictEqual(aThing.strictIsSimilar(anotherObject), false, "aThing.strictIsSimilar(aThingLikeObject) === false");


// Cloning, aClonedThing should have _id: 2
aClonedThing = aThing.clone();
assert.strictEqual(aThing.isSimilar(aClonedThing), true, "aThing.isSimilar(aClonedThing)");
assert.strictEqual(aThing.strictIsSimilar(aClonedThing), true, "aThing.strictIsSimilar(aClonedThing)");
assert.strictEqual(aClonedThing.isSimilar(aThing), true, "aClonedThing.isSimilar(aThing)");
assert.strictEqual(aClonedThing.strictIsSimilar(aThing), true, "aClonedThing.strictIsSimilar(aThing)");

assert.strictEqual(aClonedThing._id, 2, "aClonedThing should have an id: 2 " + util.inspect(aClonedThing));
// Should be true because everything in common is equal
assert.ok(aThing.equal(aThingLikeObject),"aClonedThing == aThingLikeObject");
// Should be false because aThingLikeObject._id is missing
assert.ok(aThing.strictEqual(aThingLikeObject),"aClonedThing === aThingLikeObject");
// Should be true because all the fields, except _id are in common
assert.ok(aClonedThing.equal(aThing),"aClonedThing == aThing");
// Should be false since the _id is different
assert.ok(aClonedThing.strictEqual(aThing),"aClonedThing === aThing");

// Check to make sure that aClonedThing is similar to aThingLikeObject
assert.ok(aClonedThing.isSimilar(aThingLikeObject), "aClonedThing.similar(aThingLikeObject) === true");
assert.strictEqual(aClonedThing.strictIsSimilar(anotherObject), false, "aClonedThing.strictIsSimilar(aThingLikeObject) === false");

// Sort out template support
console.log(schema.Thing.toHandlebars());
console.log("Success! [" + path.basename(process.argv[1]) + "]");
