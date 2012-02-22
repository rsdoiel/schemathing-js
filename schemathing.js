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
// revision: 0.0.1c-experiment


//
// Notes on code style
// exported functions begin with a capital letter and are camel case (e.g. Assemble())
// exported objects begin with a capitil letter and are camel case (e.g. Thing)
// functions starting with lower case are intended to be object methods (e.g. create())
//

if (require !== undefined) {
    // If we're in NodeJS bring in Hogan Template engine.
    var templateEngine = require('hogan');
}

(function() {
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
var Thing = { 
        fields: {
            description:"Text", 
            image:"URL", 
            name: "Text", 
            url: "URL"
        },
        isA: ["Thing"]
    },
    Templates = { 
        Thing: templateEngine.compile('<div itemscope itemtype="http://schema.org/Thing"><div itemprop="name">{{name}}</div><div itemprop="description">{{description}}</div><div itemprop="image">{{image}}</div><div itemprop="url">{{url}}</div></div>')
    };

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

// An SchemaThing object factory.
var create = function (defaults) {
    var newThing = this.fields;
	if (defaults === undefined || defaults._id === undefined) {
		newThing._id = NewObjectId();
	}
    newThing._isA = this.isA;
	return Assemble(newThing, defaults);
};

// Create a copy of current object with new object id
var clone = function () {
	var newObject = { _id: NewObjectId() }, self = this;
	Object.keys(self).forEach(function(ky) {
		if (ky === '_id') {
            // Skip, never clone an Id.
		} else {
			newObject[ky] = self[ky];
		}
	});
	return newObject;
};

// Update existing properties from value in another object
var update = function(obj) {
	var self = this;
	Object.keys(obj).forEach(function (ky) {
		if (ky !== "_id" && ky !== "_isA" && self[ky] !== undefined) {
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
		} else if (ky === "_isA" && obj._isA !== undefined) {
            obj._isA.forEach(function (item) {
                if (self._isA.indexOf(item) < 0) {
                    self._isA.push(item);
                }
            });
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
        } else if (ky === "_isA" && obj._isA !== undefined) {
            obj._isA.forEach(function (item) {
                if (self._isA.indexOf(item) < 0) {
                    self._isA.push(item);
                }
            });
		} else {
			self[ky] = obj[ky];
		}
	});
	return true;
};

// toJSON - return a JSON encoded result without fields beginning with
// "__"
var toJSON = function () {
    return JSON.stringify(this);
};

// toHTML, first pass at simple HTML rendering of the Thing markup
var toHTML = function (template) {
    // FIXME: need to grab the default template defined in the create
    // method and apply the fields to it.
    
    // Look at the most complex type, find it's factory, apply the template,
    // if not passed in as alternate template
    if (template === undefined) {
        // FIXME: this is a crude way to do this lookup
        template = Templates[this._isA[this._isA.length - 1]];
    }
    return template.render(this); // placeholder return
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
    schemaThing.create = create;
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
	schemaThing.toJSON = toJSON;
	schemaThing.toHTML = toHTML;
	
	return schemaThing;
};

if (typeof exports !== "undefined") {
	exports.Assemble = Assemble;
	exports.LastObjectId = LastObjectId;
	exports.NewObjectId = NewObjectId;
	exports.Thing = Thing;
    exports.Thing.create = create;
}
}());

