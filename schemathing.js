//
// schemathing.js - a JavaScript module for working with objects
// described at schema.org.
//
// @author: R. S. Doiel, <rsdoiel@gmail.com>
// copyright (c) 2011 all rights reserved
//
// Released under New the BSD License.
// See: http://opensource.org/licenses/bsd-license.php
//
// revision: 0.0.1-experiment
//

// FIXME: This should be replaced with a MongoDB style Object id
// Object Id.
var ObjectIds = { _id : 0 };

var LastObjectId = function () {
	return ObjectIds._id;
};

var NewObjectId = function () {
	ObjectIds._id += 1;
	return ObjectIds._id;
};

// Utility methods
var isOp = function (obj1, obj2, op) {
	var result = true, 
	// FIXME: keys should not be allowed to have duplicates
	keys = Object.keys(obj1).concat(Object.keys(obj2));

	keys.forEach(function(ky) {
		if (ky === '_id'  ||
			typeof obj1[ky] === 'function' || 
			typeof obj2[ky] === 'function') {
			// Skip, we're not compariing id 
		} else if (result === true) {
			switch(op) {
			case '===':
				result = (obj1[ky] === obj2[ky]);
				break;
			case '==':
				result = (obj1[ky] == obj2[ky]);
				break;
			case '!==':
				result = (obj1[ky] !== obj2[ky]);
				break;
			case '!=':
				result = (obj1[ky] != obj2[ky]);
				break;
			}
		}
	});
	return result;
};


//
// Thing - the base object described at schema.org
//
var Thing = {};

// These methods are the common across schemething
var equal = function (obj) {
	return isOp(this, obj, '==');	
};

var strictEqual = function (obj) {
	return isOp(this, obj, '===');
};

var notEqual = function (obj) {
	return isOp(this, obj, '!=');
};

var notStrictEqual = function (obj) {
	return isOp(this, obj, '!==');
};

// obj has the same non-function, non-_id properties as self
var isSimilar = function (obj) {
	var self = this, result = true;

	Object.keys(self).forEach(function (ky) {
		if (result === true && ky !== "_id" && 
			typeof self[ky] !== "function") {
			if (obj[ky] === undefined) {
				result = false;
			}
		}
	});
	return result;
};

// all properties are in common
var strictIsSimilar = function (obj) {
	var self = this, result = true;

	Object.keys(self).concat(Object.keys(obj)).forEach(function (ky) {
		if (result === true) {
			if (typeof self[ky] !== typeof obj[ky]) {
				result = false;
			}
		}
	});
	return result;
};

// Create a copy of current object with new object id
var clone = function () {
	var newObject = { _id: NewObjectId() }, self = this;
	Object.keys(self).forEach(function(ky) {
		if (ky !== '_id') {
			newObject[ky] = self[ky];
		}
	});
	return newObject;
};
// Update existing properties from value in another object
var update = function(obj) {
	var self = this;
	Object.keys(obj).forEach(function (ky) {
		if (ky !== "_id" && self[ky] !== undefined) {
			self[ky] = obj[ky];
		}
	});
	return true;
};

// Absorb the properties from a new object without overwriting the existing properties
var absorb = function (obj) {
	var self = this;
	Object.keys(obj).forEach(function (ky) {
		if (ky === "_id") {
			// skip
		} else if (self[ky] === undefined) {
			self[ky] = obj[ky];
		}
	});
	return true;
};

// Morph - Update existing properties and add any additoinal properties from the other object 
var morph = function (obj) {
	var self = this;
	Object.keys(obj).forEach(function (ky) {
		if (ky === "_id") {
			// skip
		} else {
			self[ky] = obj[ky];
		}
	});
	return true;
};

var Assemble = function(schemaThing, defaults) {
	if (defaults !== undefined) {
		Object.keys(defaults).forEach(function(ky) {
			schemaThing[ky] = defaults[ky];
		});
	}

	if (schemaThing._id === undefined) {
		schemaThing._id = NewObjectId();
	}
	if (schemaThing.name === "") {
		schemaThing.name = "schemathing_" + schemaThing._id;
	}

	// Attach Thing methods to the new object
	schemaThing.clone = clone;
	schemaThing.equal = equal;
	schemaThing.isSimilar = isSimilar;
	schemaThing.strictIsSimilar = strictIsSimilar;
	schemaThing.notEqual = notEqual;
	schemaThing.strictEqual = strictEqual;
	schemaThing.notStrictEqual = notStrictEqual;
	schemaThing.update = update;
	schemaThing.absorb = absorb;
	schemaThing.morph = morph;
	
	return schemaThing;
};

// Thing is a "Thing" object factory.
var createThing = function (defaults) {
	var newThing = {
		description: "",
		image : "",
		name : "",
		url : ""
	};
	if (defaults === undefined || defaults._id === undefined) {
		newThing._id = NewObjectId();
	}
	return Assemble(newThing, defaults);
};


if (exports !== undefined) {
	exports.Assemble = Assemble;
	exports.LastObjectId = LastObjectId;
	exports.NewObjectId = NewObjectId;
	exports.Thing = Thing;
	exports.Thing.create = createThing;
}

