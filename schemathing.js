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

// FIXME: This should be replaced with a MongoDB compatible
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
var compareWith = function (obj1, obj2, op) {
	switch(op) {
		case '===':
			return (obj1 === obj2);
		case '==':
			return (obj1 == obj2);
		case '!==':
			return (obj1 !== obj2);
		case '!=':
			return (obj1 != obj2);
	};
	return false;
};

var compareObj = function (obj1, obj2, op) {
	var result = false;
	Object.keys(obj1).forEach(function(ky) {
		if (ky === '_id' || ky === '_isA') {
			// Skip for equal
		} else {
			if (obj2[ky] === undefined) {
				result = false;
			} else if (compareWith(obj1[ky],obj2[ky],op) === false) {
				result = false;
			}
		}
	});
	return result;
};

var Thing = {};


// These methods are the common across schemething
var equal = function (obj) {
	return compareObj(this, obj, '==');	
};
var notEqual = function (obj) {
	return compareObj(this, obj, '!=');
};

var strictEqual = function (obj) {
	return compareObj(this, obj, '===');
};

var notStrictEqual = function (obj) {
	return compareObj(this, obj, '!==');
};

var absorb = function (obj) {
	Object.keys(obj).forEach(function (ky) {
		if (ky === "_isA") {
			obj[ky].forEach(function(val) {
				if (this._isA.indexOf(val) < 0) {
					this._isA.push(val);
				}
			});
		} else if (ky !== "_id") {
			this[ky] = obj[ky];
		}
	});
};

var Assemble = function(schemaThing, defaults) {
	if (defaults !== undefined) {
		Object.keys(defaults).forEach(function(ky) {
			if (ky == '_isA') {
				schemaThing[ky].push(defaults[ky]);
			} else {
				schemaThing[ky] = defaults[ky];
			}
		});
	}

	if (schemaThing._id === undefined) {
		schemaThing._id = NewObjectId();
	}
	if (schemaThing.name === "") {
		schemaThing.name = schemaThing._isA[0] + "_" + schemaThing._id;
	}

	// Attach Thing methods to the new object
	schemaThing.equal = equal;
	schemaThing.notEqual = notEqual;
	schemaThing.strictEqual = strictEqual;
	schemaThing.notStrictEqual = notStrictEqual;
	schemaThing.absorb = absorb;
	// schemaThing.morph = morph;
	
	return schemaThing;
};

// Thing is a "Thing" object factory.
var createThing = function (defaults) {
	var newThing = { 
		_isA : ['Thing'],
		description: "",
		image : "",
		name : "",
		url : ""
	};
	if (defaults !== undefined) {
		return Assemble(newThing, defaults);
	}
	newThing._id = NewObjectId();
	return newThing;
}


if (exports !== undefined) {
	exports.Assemble = Assemble;
	exports.LastObjectId = LastObjectId;
	exports.NewObjectId = NewObjectId;
	exports.Thing = Thing;
	exports.Thing.create = createThing;
}

