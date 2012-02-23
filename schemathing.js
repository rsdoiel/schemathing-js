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
// revision: 0.0.0e-experiment
//

//
// Notes on code style
// exported functions begin with a capital letter and are camel case (e.g. Assemble())
// exported objects begin with a capitil letter and are camel case (e.g. Thing)
// functions starting with lowercase are intended to be object methods applied
// by a factory (e.g. var myt = Thing.create(); console.log(myt.toJSON());)
//

// FIXME: need to figure out how to deal with common import
// for browsere, NodeJS and MongoDB's JS shell.
// FIXME: need to allow for user defined template engine.
// (e.g. mote-js, Handlebars, etc.)
// If we're in NodeJS bring in the Template engine.
var url = require('url'),
	mote = require('mote');

//
// FIXME: Need to make ObjectIds, LastObjectId and NewObjectId conditionally defined
// so this will work in MongoDB's shell
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
	// FIXME: keys can have duplicates with concat
	// should really with there was a concat().unique()
	keys = Object.keys(obj1).concat(Object.keys(obj2));	

	keys.forEach(function(ky) {
		if (ky === '_id'  ||
			ky === '_isA' ||
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
// Core data types
//
var DataType = {
	isBoolean: function (val) {
		if (val === true || val === false) {
			return true;
		}
		return false;
	},
	isDate: function (iso8601) {
		if (Number(Date.parse(iso8601))) {
			return true;
		}
		return false;
	},
	isNumber: function(num) {
		if (Number(num)) {
			return true;
		}
		return false;
	},
	isInteger: function (num) {
		// FIXME: write this
		throw "isInteger Not Imeplemented: " + num;
	},
	isText: function (Text) {
		if (typeof Text === "string") {
			return true;
		}
		return false;
	},
	isURL: function (URL) {
		if (url.format(url.parse(URL)) === URL) {
			return true;
		}
		return false;
	}
};


// Options is any additional array attribute strings for outer div
// E.g. ['class="myclass"','id="my_id"','editable']
var toHandlebars = function(options) {
	var innerHTML = [], attributes = ['itemscope', 'itemtype="' + this.itemTypeURL + '"'],
	markup = function (tag_name, attributes, innerHTML) {
		return '<' + (tag_name + ' ' + attributes.join(" ")).trim() + '>' + innerHTML.trim() + '</' + tag_name + '>';
	};
	
	if (options !== undefined) {
		attributes = options.concat(attributes);
	}

	Object.keys(this.fields).forEach(function(ky) {
		// FIXME: Should look at Type and instroduce sub-scope as needed.
		innerHTML.push(markup('div',['itemprop="' + ky + '"'], '{{' + ky + '}}'));
	});
	return markup('div', attributes,innerHTML.join(''));
};

//
// Thing - the base object described at schema.org
//
var combineFields = function () {
	var args = Array.prototype.slice.call(arguments),
	result = {};
	args.forEach(function(field) {
		Object.keys(field).forEach(function(ky) {
			result[ky] = field[ky];
		});
	});
	return result;
};

var Thing = { 
        fields: {
            description: "Text", 
            image: "URL", 
            name: "Text", 
            url: "URL"
        },
        isA: ["Thing"],
        itemTypeURL: "http://schema.org/Thing"
    },
    CreativeWork = {
        fields: combineFields(Thing.fields,{
            about: "Thing",
            accountablePerson: "Person",
            aggregateRating: "AggregateRating",
            alternativeHeadline: "Text",
            associatedMedia: "MediaObject",
            audio: "AudioObject",
            author: "Person||Organization",
            awards: "Text",
            comment: "UserComments",
            contentLocation: "Place",
            contentRating: "Text",
            contributor: "Person||Organization",
            copyrightHolder: "Person||Organization",
            copyrightYear: "Number",
            creator: "Person||Organization", 
            dateCreated: "Date",
            dateModified: "Date",
            datePublished: "Date",
            discussionUrl: "URL",
            editor: "Person||Organization",
            encodings: "MediaObject",
            genre: "Text",
            headline: "Text",
            inLanguage: "Text",
            interactionCount: "Text",
            isFamilyFriendly: "Person||Organization",
            keywords: "Text",
            mentions: "Thing",
            offers: "Offer",
            provider: "Person||Organization",
            publisher: "Person||Organization",
            publishingPrinciples: "URL",
            reviews: "Review",
            sourceOrganization: "Organization",
            thumbnailUrl: "URL",
            version: "Number",
            video: "VideoObject"
        }),
        isA: ["Thing", "CreativeWork"],
        itemTypeURL: "http://schema.org/CreativeWork"
    },
    Article = {
        fields: combineFields(CreativeWork.fields, {
            articleBody: "Text",
            articleSection: "Text",
            wordCount: "Interger"
        }),
        isA: ["Thing", "CreativeWork", "Article"],
        itemTypeURL: "http://schema.org/Article"
    },
    BlogPosting = {
        fields: combineFields(CreativeWork.fields,{
            articleBody: "Text",
            articleSection: "Text",
            wordCount: "Interger"
        }),
        isA: ["Thing", "CreativeWork", "Article", "BlogPosting"],
        itemTypeURL: "http://schema.org/BlogPosting"
    },
    NewsArticle = {
        fields: combineFields(Article.fields, {
            dateline: "Text",
            printColumn: "Text",
            printEdition: "Text",
            printPage: "Text",
            printSection: "Text"
        }),
        isA: ["Thing", "CreativeWork", "Article", "NewsArticle"],
        itemTypeURL: "http://schema.org/NewsArticle"
    },
    ScholarlyArticle = {
        fields: combineFields(Article.fields, {
            articleBody: "Text",
            articleSection: "Text",
            wordCount: "Interger"
        }),
        isA: ["Thing", "CreativeWork", "Article", "ScholarlyArticle"],
        itemTypeURL: "http://schema.org/ScholarlyArticle"
    },
    Blog = {
        fields: combineFields(CreativeWork.fields, {
            blogPosts: "BlogPosting"
        }),
        isA: ["Thing", "CreativeWork", "Blog"],
        itemTypeURL: "http://schema.org/Blog"
    },
    Book = {
        fields: combineFields(CreativeWork.fields, {
            bookEdition: "Text",
            bookFormat: "BookFormatType",
            illustrator: "Person",
            isbn: "Text",
            numberOfPages: "Number"
        }),
        isA: ["Thing", "CreativeWork", "Book"],
        itemTypeURL: "http://schema.org/Book"
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
		if (result === true && 
			ky !== "_id" &&
			ky !== "_isA" &&
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
    var newThing = {}, self = this;
    Object.keys(self.fields).forEach(function (ky) {
        newThing[ky] = self.fields[ky];
    });
	if (defaults === undefined || defaults._id === undefined) {
		newThing._id = NewObjectId();
	}
    newThing._isA = this.isA;
    newThing.toHTML = function (options) {
    	var template = mote.compile(self.toHandlebars(options));
    	return template(this);
    };
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


// defaults are presumed to be the usual JS object
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
	return schemaThing;
};

// FIXME: Need to figure out browser/MongoDB Shell
// equivalent of NodeJS' exports.
exports.Assemble = Assemble;
exports.LastObjectId = LastObjectId;
exports.NewObjectId = NewObjectId;
exports.DataType = DataType;
exports.Thing = Thing;
exports.Thing.create = create;
exports.Thing.toHandlebars = toHandlebars;
exports.CreativeWork = CreativeWork;
exports.CreativeWork.create = create;
exports.CreativeWork.toHandlebars = toHandlebars;
exports.Article = Article;
exports.Article.create = create;
exports.Article.toHandlebars = toHandlebars;
exports.BlogPosting = BlogPosting;
exports.BlogPosting.create = create;
exports.BlogPosting.toHandlebars = toHandlebars;
exports.NewsArticle = NewsArticle;
exports.NewsArticle.create = create;
exports.NewsArticle.toHandlebars = toHandlebars;
exports.ScholarlyArticle = ScholarlyArticle;
exports.ScholarlyArticle.create = create;
exports.ScholarlyArticle.toHandlebars = toHandlebars;
exports.Blog = Blog;
exports.Blog.create = create;
exports.Blog.toHandlebars = toHandlebars;
exports.Book = Book;
exports.Book.create = create;
exports.Book.toHandlebars = toHandlebars;
