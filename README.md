schemathing-js
========
0.0.0c-experiment
----------------

# Overview

schemathing-js is an experiment in implementing a set of javascript objects that map to/from the microdata format as defined at schema.org.

# A example Thing

A +Thing+ object might have the following methods --

## factory operations

### create()

params:  _an object_ (optional) E.g. A mongo object id.

Creates a new thing object. If an _id is with an object it will use that id (e.g. so you could instantiate a copy of a MongoDB object). If not it will create an _id property using a NewObjectId() function if defined.


### clone()

params: _object_id_ (optional)

Creates a copy of itself into a new thing but with a new object_id.

## comparison operations

### isSimilar()

params: _an object_ (required)

Checks if an object has same properties (other object could have additional properties)

### strictIsSimilar()

params: _an object_ (required)

Both objects have every property in common

### equal()

params: _an object_ (required)

Check to see if properties in common are equal (==).

### strictEqual()

params: _an object_ (required)

Check to see if common properties are strictly equal (===).


### notEqual()

params: _an object_ (required)

Check to see if properties in common are not equal (!=); returns true of false.


### notStrictEqual()

params: _an object_ (required)

Check to see if properties in common are strictly not equal (!==); returns true or false.


## transformation functions

### update()

params: _an object_ (required)

Replace common properties from another object (except _id)

### absorb()

params: _an object_ (required)

Update and add additional properties from another object (except _id, merge _isA list)

### morph()

params: _an object_ (required)

Overwrite and add additional properties passed into morph (except _id, merge _isA list)


## extraction

Someday maybe.  It'd be noice to have something like

    var myNewThing = Thing.create(some_html_fragment);


## rendering methods

### toHtml()

Return the thing object as a schema.org defined markup html block. Object's id would map to the id attribute in the outer tag.

### toJSON()

Render as JSON

The grand idea for this module would provide support for all the schema types defined at schema.org with a consistent set of methods and attributes.

# A theoretical example using the module in NodeJS

    var assert = require('assert'),
    	schema = require('schemathing');
    
    // Dummy Object id objects and functions
    var ObjectIds = { _id: 0 },
    	NewObjectId = function () {
    		ObjectIds._id += 1;
    		return ObjectIds._id;
    	},
    	LastObjectId = function () {
    		return ObjectIds._id;
    	};

	// Example playing with things
    var aThing, aClonedThing,
    	aEvent, 
    	aThingLikeObject = {
    		description: "A plain old JavaScript object.",
			image: "http://example.com/a-plain-js-object.jpg",
			name: 'aThingLikeObject',
			url: "http://example.com/a-plain-js-object.json"
    	};
    
    // Creating an empty thing
    aThing = scheme.Thing.create({_id:1});
    assert.strictEqual(aThing._id, 1, "aThing._id === 1");
    // Should return false since aThing has nothing in common with aThingLikeObject
    assert.ok(aThing.equal(aThinkLikeObject),"aThing == aThingLikeObject" );
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

 	aEvent = schema.Event.create();
 	aEvent.merge(AThingLikeObject);
 	aEvent.name = "A new Event.";
 	aEvent.duration = '2h';
 	aEvent.startDate = new Date();
 	aEvent.endDate = new Date();
 	console.log("aEvent.toJSON(): " + aEvent.toJSON());
 	console.log("aEvent.toHtml(): " + aEvent.toHtml());

	
# Background notes

* http://schema.org - the definitions for HTML microdata
* http://www.google.com/webmasters/tools/richsnippets test tool for microdata
* http://www.mongodb.org/display/DOCS/Object+IDs - examplanation of MongoID's ObjectId
* https://github.com/justaprogrammer/ObjectId.js/blob/master/Objectid.js - an example implementation in JavaScript

# Random ideas

* schemathing.js should work in NodeJS, MongoDB's shell and HTML5 friendly browsers
* dirty.js would be an interesting environment to play with shemathing for in-memory only applications
* the property types need to be validated against schema.org's description (e.g. Boolean, Date, Number, Text, URL)

# Notes on coding style

+ exported functions begin with a capital letter and are camel case (e.g. Assemble())
+ exported objects begin with a capitil letter and are camel case (e.g. Thing)
+ functions starting with lowercase are intended to be object methods applied by a factory (e.g. var myt = Thing.create(); console.log(myt.toJSON());)



