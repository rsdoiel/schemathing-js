schemathing-js
========
0.0.0-experiment
----------------

# Overview

thing-js is an experiment in implementing an set of javascript object that map to and from the microformats defined at schema.org.

# A example Thing

A +Thing+ object might have the following methods --

* create() - creates a new thing object. If an _id is with an object it will use that id (e.g. so you could instantiate a copy of a MongoDB object). If not it will create an _id property using a NewObjectId() function if defined.
++ _an object_ (optional) E.g. A mongo object id.
* clone() - creates a copy of itself into a new thing but with a new object_id.
++ _object_id_ (optional)
* is() - checks if an object is of the same type or is a decendant type. Without an argument it returns a string of it's type. With a string parameter it will return true if it is the same type or inherits from that type
++ _type_name_ (optional) if type_name matches return true, otherwise false
* strictIs() - same as is() strict but will not match against parent types
* equal() - Check to see if properties in common are equal (==).
++ _an object_ (required)
* strictEqual() - Check to see if common properties are strickly equal (===).
++ _an object_ (required)
* notEqual() - Check to see if properties in common are not equal (!=); returns true of false.
++ _an object_ (required)
* notStrictEqual() - Check to see if properties in common are strictly not equal (!==); returns true or false.
++ _an object_ (required)
* merge() - Update the properties of thing from the in common properties passed into merge
* strictMerge() - Update the properties of thing from all the properties passed into merge
++ _an object_ (required)
* diff() - Given another object return an object with fields not in common or not equal (==).
++ _an object_ (require)
* strictDiff() - Given another object return an object with fields not in common or strict not equal (===).
++ _an object_ (require)
* toHtml() - return the thing object as a schema.org defined markup html block. Object's id would map to the id attribute in the outer tag.
* toJSON() - render as json
* toSource() - render as JavaScript including it's functions

The grand idea for this module would provide support for all the schema types defined at schema.org with a consistent set of methods and attributes.

# A theoretical example using the module

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

	
    
    