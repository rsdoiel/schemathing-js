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
var ObjectIds = exports.ObjectIds = { _id : 0 };

exports.LastObjectId = function () {
	return ObjectIds._id;
};

var NewObjectId = exports.NewObjectId = function () {
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
var exports.DataType = {
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
    newThing.toJSON = function () {
        var obj = {}, newSelf = this;
        Object.keys(self.fields).forEach(function (ky) {
            obj[ky] = newSelf[ky];
        });
        return JSON.stringify(obj);
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
var Assemble = exports.Assemble = function(schemaThing, defaults) {
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

var Thing = exports.Thing = { 
        fields: {
            description: "Text", 
            image: "URL", 
            name: "Text", 
            url: "URL"
        },
        isA: ["Thing"],
        itemTypeURL: "http://schema.org/Thing"
    },
    CreativeWork = exports.CreativeWork = {
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
    Article = exports.Article = {
        fields: combineFields(CreativeWork.fields, {
            articleBody: "Text",
            articleSection: "Text",
            wordCount: "Interger"
        }),
        isA: ["Thing", "CreativeWork", "Article"],
        itemTypeURL: "http://schema.org/Article"
    },
    Blog = exports.Blog = {
        fields: combineFields(CreativeWork.fields, {
            blogPosts: "BlogPosting"
        }),
        isA: ["Thing", "CreativeWork", "Blog"],
        itemTypeURL: "http://schema.org/Blog"
    },
    Book = exports.Book = {
        fields: combineFields(CreativeWork.fields, {
            bookEdition: "Text",
            bookFormat: "BookFormatType",
            illustrator: "Person",
            isbn: "Text",
            numberOfPages: "Number"
        }),
        isA: ["Thing", "CreativeWork", "Book"],
        itemTypeURL: "http://schema.org/Book"    	
    },
    ItemList = exports.ItemList = {
        fields: combineFields(CreativeWork.fields, {
            itemListElement: "Text",
            itemListOrder: "Text"
        }),
        isA: ["Thing", "CreativeWork", "ItemList"],
        itemTypeURL: "http://schema.org/ItemList"
    },
    Map = exports.Map = {
        fields: CreativeWork.fields,
        isA: ["Thing", "CreativeWork", "Map"],
        itemTypeURL: "http://schema.org/Map"
    },
    MediaObject = exports.MediaObject = {
        fields: combineFields(CreativeWork.fields,{
            associatedArticle: "NewsArticle",
            bitrate: "Text",
            contentSize: "Text",
            contentURL: "URL",
            duration: "Duration",
            embedURL: "URL",
            encodesCreativeWork: "CreativeWork",
            encodingFormat: "Text",
            expires: "Date",
            height: "Distance",
            playerType: "Text",
            regionsAllowed: "Place",
            requiresSubscription: "Boolean",
            uploadDate: "Date",
            width: "Distance"
        }),
        isA: ["Thing", "CreativeWork", "MediaObject"],
        itemTypeURL: "http://schema.org/MediaObject"
    },
    AudioObject = exports.AudioObject = {
        fields: combineFields(MediaObject.fields,{
            transcript: "Text"
        }),
        isA: ["Thing", "CreativeWork", "MediaObject", "AudioObject"],
        itemTypeURL: "http://schema.org/AudioObject"
    },
    ImageObject = exports.ImageObject = {
        fields: combineFields(MediaObject.fields,{
            caption: "Text",
            exifData: "Text",
            representativeOfPage: "Boolean",
            thumbnail: "ImageObject"
        }),
        isA: ["Thing", "CreativeWork", "MediaObject", "ImageObject"],
        itemTypeURL: "http://schema.org/ImageObject"
    },
    MusicVideoObject = exports.MusicVideoObject = {
        fields: MediaObject.fields,
        isA: ["Thing", "CreativeWork", "MediaObject", "MusicVideoObject"],
        itemTypeURL: "http://schema.org/MusicVideoObject"
    },
    VideoObject = exports.VideoObject = {
        fields: combineFields(MediaObject.fields, {
            caption: "Text",
            productionCompany: "Organization",
            thumbnail: "ImageObject",
            transcript: "Text",
            videoFrameSize: "Text",
            videoQuality: "Text"
        }),
        isA: ["Thing", "CreativeWork", "MediaObject", "VideoObject"],
        itemTypeURL: "http://schema.org/VideoObject"
    },
    Movie = exports.Movie = {
        fields: combineFields(CreativeWork.fields, {
            actors: "Person", 
            director: "Person", 
            duration: "Duration",
            musicBy: "Person||MusicGroup",
            producer: "Person",
            productionCompany: "Organization",
            trailer: "VideoObject"
        }),
        isA: ["Thing", "CreativeWork", "Movie"],
        itemTypeURL: "http://schema.org/Movie"        
    },
    MusicPlayList = exports.MusicPlayList = {
        fields: combineFields(CreativeWork.fields, {
            numTracks: "Integer",
            tracks: "MusicRecording"
        }),
        isA: ["Thing", "CreativeWork", "MusicPlayList"],
        itemTypeURL: "http://schema.org/MusicPlayList"
    },
    Event = exports.Event = {
    	fields: combineFields(Thing.fields, {
    		attendees: "Person||Organization",
    		duration: "Duration",
    		endDate: "Date",
    		location: "Place||PostalAddress",
    		offers: "Offer",
    		performers: "Person||Organization",
    		startDate: "Date",
    		subEvents: "Event",
    		superEvent: "Event"
    	}),
        isA: ["Thing", "Event"],
        itemTypeURL: "http://schema.org/Event"
    },
    Intangible = exports.Intangible = {
    	fields: Thing.fields,
        isA: ["Thing", "Intangible"],
        itemTypeURL: "http://schema.org/Intangible"    	
    },
    Person = exports.Person = {
    	fields: combineFields(Thing.fields, {
    		additionalName: "Text",
    		address: "PostalAddress",
    		affiliation: "Organization",
    		alumniOf: "EducationalOrganization",
    		awards: "Text",
    		birthDate: "Date",
    		children: "Person",
    		colleagues: "Person",
    		contactPoints: "ContactPoint",
    		deathDate: "Date",
    		email: "Text",
    		familyName: "Text",
    		faxNumber: "Text",
    		follows: "Person",
    		gender: "Text",
    		givenName: "Text",
    		homeLocation: "Place||ContactPoint",
    		honorificPrefix: "Text",
    		honorificSuffix: "Text",
    		interactionCount: "Text",
    		jobTitle: "Text",
    		knows: "Person",
    		memberOf: "Organization",
    		nationality: "Country",
    		parents: "Person",
    		performerIn: "Event",
    		relatedTo: "Person",
    		siblings: "Person",
    		spouse: "Person",
    		telephone: "Text",
    		workLocation: "Place||ContactPoint",
    		worksFor: "Organization"
    	}),
        isA: ["Thing", "Person"],
        itemTypeURL: "http://schema.org/Person"    	
    },
    Place = exports.Place = {
    	fields: combineFields(Thing.fields, {
    		address: "PostalAddress",
    		aggregateRating: "AggregateRating",
    		containedIn: "Place",
    		events: "Event",
    		faxNumber: "Text",
    		geo: "GeoCoordinates||GeoShape",
    		interactionCount: "Text",
    		maps: "URL",
    		photos: "Photograph||ImageObject",
    		reviews: "Review",
    		telephone: "Text"
    	}),
        isA: ["Thing", "Place"],
        itemTypeURL: "http://schema.org/Place"    	
    },
    CivicStructure = exports.CivicStructure = {
    	fields: combineFields(Place.fields, {openingHours: "Duration"}),
        isA: ["Thing", "Place", "CivicStructure"],
        itemTypeURL: "http://schema.org/CivicStructure"
    },
    Product = exports.Product = {
    	fields: combineFields(Thing.fields, {
    		aggregateRating: "AggregateRating",
    		brand: "Organization",
    		manufacturer: "Organization",
    		model: "Text",
    		offers: "Offers",
    		productID: "Text",
    		reviews: "Review"
    	}),
        isA: ["Thing", "Product"],
        itemTypeURL: "http://schema.org/Product"    	
    },
    BlogPosting = exports.BlogPosting = {
        fields: combineFields(CreativeWork.fields,{
            articleBody: "Text",
            articleSection: "Text",
            wordCount: "Interger"
        }),
        isA: ["Thing", "CreativeWork", "Article", "BlogPosting"],
        itemTypeURL: "http://schema.org/BlogPosting"
    },
    NewsArticle = exports.NewsArticle = {
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
    ScholarlyArticle = exports.ScholarlyArticle = {
        fields: combineFields(Article.fields, {
            articleBody: "Text",
            articleSection: "Text",
            wordCount: "Interger"
        }),
        isA: ["Thing", "CreativeWork", "Article", "ScholarlyArticle"],
        itemTypeURL: "http://schema.org/ScholarlyArticle"
    },
    MusicAlbum = exports.MusicAlbum = {
        fields: combineFields(MusicPlayList.fields, {
            byArtist: "MusicGroup"
        }),
        isA: ["Thing", "CreativeWork", "MusicPlayList", "MusicAlbum"],
        itemTypeURL: "http://schema.org/MusicAlbum"
    },
    MusicGroup = exports.MusicGroup = {
        fields: combineFields(MusicPlayList.fields, {
            byArtist: "MusicGroup"
        }),
        isA: ["Thing", "CreativeWork", "MusicPlayList", "MusicAlbum"],
        itemTypeURL: "http://schema.org/MusicAlbum"
    },
    MusicRecording = exports.MusicRecording = {
    	fields: combineFields(CreativeWork.fields, {
    		byArtist: "MusicGroup",
    		duration: "Duration",
    		inAlbum: "MusicAlbum", 
    		inPlaylist: "MusicPlayList"
    	}),
        isA: ["Thing", "CreativeWork", "MusicRecording"],
        itemTypeURL: "http://schema.org/MusicRecording"
    },
    Painting = exports.Painting = {
    	fields: CreativeWork.fields,
        isA: ["Thing", "CreativeWork", "Painting"],
        itemTypeURL: "http://schema.org/Painting"    	
    },
    Photograph = exports.Photograph = {
    	fields: CreativeWork.fields,
        isA: ["Thing", "CreativeWork", "Photograph"],
        itemTypeURL: "http://schema.org/Photograph"    	
    },
    Recipe = exports.Recipe = {
    	fields: combineFields(CreativeWork.fields, {
			cookTime: "Duration",
			cookingMethod: "Text",
			ingredients: "Text",
			nutrition: "NutritionInformation",
			prepTime: "Duration",
			recipeCategory: "Text",
			recipeCuisine: "Text",
			recipeInstructions: "Text",
			recipeYield: "Text", 
			totalTime: "Duration"
    	}),
        isA: ["Thing", "CreativeWork", "Recipe"],
        itemTypeURL: "http://schema.org/Recipe"    	
    },
	Review = exports.Review = {
		fields: combineFields(CreativeWork.fields, {
			itemReviewed: "Thing",
			reviewBody: "Text",
			reviewRating: "Rating"
		}),
        isA: ["Thing", "CreativeWork", "Review"],
        itemTypeURL: "http://schema.org/Review"
	},
	Sculpture = exports.Sculpture = {
		fields: CreativeWork.fields,
        isA: ["Thing", "CreativeWork", "Sculpture"],
        itemTypeURL: "http://schema.org/Sculpture"
	},
	TVEpisode = exports.TVEpisode = {
		fields: combineFields(CreativeWork.fields, {
			actors: "Person",
			director: "Person",
			episodeNumber: "Number",
			musicBy: "Person||MusicGroup",
			partOfSeason: "TVSeason",
			partOfTVSeries: "TVSeries",
			producer: "Person",
			productionCompany: "Organization",
			trailer: "VideoObject"
		}),
        isA: ["Thing", "CreativeWork", "TVEpisode"],
        itemTypeURL: "http://schema.org/TVEpisode"
	},
	TVSeason = exports.TVSeason = {
		fields: combineFields(CreativeWork.fields, {
			endDate: "Date",
			episodes: "TVEpisode",
			numberOfEpisodes: "Number",
			partOfTVSeries: "TVSeries",
			seasonNumber: "Integer",
			startDate: "Date",
			trailer: "VideoObject"
		}),
        isA: ["Thing", "CreativeWork", "TVSeason"],
        itemTypeURL: "http://schema.org/TVSeason"
	},
	TVSeries = exports.TVSeries = {
		fields: combineFields(CreativeWork.fields, {
			actors: "Person",
			director: "Person",
			endDate: "Date",
			episodes: "TVEpisode",
			musicBy: "Person||MusicGroup",
			numberOfEpisodes: "Number",
			producer: "Person",
			productionCompany: "Organization",
			seasons: "TVSeason",
			startDate: "Date",
			trailer: "VideoObject"
		}),
        isA: ["Thing", "CreativeWork", "TVSeries"],
        itemTypeURL: "http://schema.org/TVSeries"
	},
	WebPage = exports.WebPage = {
		fields: combineFields(CreativeWork.fields, {
			breadcrumb: "Text",
			isPartOf: "CollectionPage",
			mainContentOfPage: "WebPageElement",
			primaryImageOfPage: "ImageObject",
			significantLinks: "URL"
		}),
        isA: ["Thing", "CreativeWork", "WebPage"],
        itemTypeURL: "http://schema.org/WebPage"
	},
	AboutPage = exports.AboutPage = {
		fields: WebPage.fields,
        isA: ["Thing", "CreativeWork", "WebPage", "AboutPage"],
        itemTypeURL: "http://schema.org/AboutPage"
	},
	CheckoutPage = exports.CheckoutPage = {
		fields: WebPage.fields,
        isA: ["Thing", "CreativeWork", "WebPage", "CheckoutPage"],
        itemTypeURL: "http://schema.org/CheckoutPage"
	},
	CollectionPage = exports.CollectionPage = {
		fields: WebPage.fields,
        isA: ["Thing", "CreativeWork", "WebPage", "CollectionPage"],
        itemTypeURL: "http://schema.org/CollectionPage"
	},
	ImageGallery = exports.ImageGallery = {
		fields: WebPage.fields,
        isA: ["Thing", "CreativeWork", "WebPage", "CollectionPage", "ImageGallery"],
        itemTypeURL: "http://schema.org/ImageGallery"
	},
	VideoGallery = exports.VideoGallery = {
		fields: WebPage.fields,
        isA: ["Thing", "CreativeWork", "WebPage", "CollectionPage", "VideoGallery"],
        itemTypeURL: "http://schema.org/VideoGallery"
	},
	ContactPage = exports.ContactPage = {
		fields: WebPage.fields,
        isA: ["Thing", "CreativeWork", "WebPage", "ContactPage"],
        itemTypeURL: "http://schema.org/ContactPage"
	},
	ItemPage = exports.ItemPage = {
		fields: WebPage.fields,
        isA: ["Thing", "CreativeWork", "WebPage", "ItemPage"],
        itemTypeURL: "http://schema.org/ItemPage"
	},
	ProfilePage = exports.ProfilePage = {
		fields: WebPage.fields,
        isA: ["Thing", "CreativeWork", "WebPage", "ProfilePage"],
        itemTypeURL: "http://schema.org/ProfilePage"
	},
	SearchResultsPage = exports.SearchResultsPage = {
		fields: WebPage.fields,
        isA: ["Thing", "CreativeWork", "WebPage", "SearchResultsPage"],
        itemTypeURL: "http://schema.org/SearchResultsPage"
	},
	WebPageElement = exports.WebPageElement = {
		fields: CreativeWork.fields,
        isA: ["Thing", "CreativeWork", "WebPageElement"],
        itemTypeURL: "http://schema.org/WebPageElement"
	},
	SiteNavigationElement = exports.SiteNavigationElement = {
		fields: CreativeWork.fields,
        isA: ["Thing", "CreativeWork", "WebPageElement", "SiteNavigationElement"],
        itemTypeURL: "http://schema.org/SiteNavigationElement"
	},
	Table = exports.Table = {
		fields: CreativeWork.fields,
        isA: ["Thing", "CreativeWork", "WebPageElement", "Table"],
        itemTypeURL: "http://schema.org/Table"
	},
	WPAdBlock = exports.WPAdBlock = {
		fields: CreativeWork.fields,
        isA: ["Thing", "CreativeWork", "WebPageElement", "WPAdBlock"],
        itemTypeURL: "http://schema.org/WPAdBlock"
	},
	WPFooter = exports.WPFooter = {
		fields: CreativeWork.fields,
        isA: ["Thing", "CreativeWork", "WebPageElement", "WPFooter"],
        itemTypeURL: "http://schema.org/WPFooter"
	},
	WPHeader = exports.WPHeader = {
		fields: CreativeWork.fields,
        isA: ["Thing", "CreativeWork", "WebPageElement", "WPHeader"],
        itemTypeURL: "http://schema.org/WPHeader"
	},
	WPSideBar = exports.WPSideBar = {
		fields: CreativeWork.fields,
        isA: ["Thing", "CreativeWork", "WebPageElement", "WPSideBar"],
        itemTypeURL: "http://schema.org/WPSideBar"
	},
	BusinessEvent = exports.BusinessEvent = {
		fields: Event.fields,
        isA: ["Thing", "Event", "BusinessEvent"],
        itemTypeURL: "http://schema.org/BusinessEvent"
	},
	ChildrensEvent = exports.ChildrensEvent = {
		fields: Event.fields,
        isA: ["Thing", "Event", "ChildrensEvent"],
        itemTypeURL: "http://schema.org/ChildrensEvent"
	},
	ComedyEvent = exports.ComedyEvent = {
		fields: Event.fields,
        isA: ["Thing", "Event", "ComedyEvent"],
        itemTypeURL: "http://schema.org/ComedyEvent"
	},
	DanceEvent = exports.DanceEvent = {
		fields: Event.fields,
        isA: ["Thing", "Event", "DanceEvent"],
        itemTypeURL: "http://schema.org/DanceEvent"
	},
	EducationEvent = exports.EducationEvent = {
		fields: Event.fields,
        isA: ["Thing", "Event", "EducationEvent"],
        itemTypeURL: "http://schema.org/EducationEvent"
	},
	Festival = exports.Festival = {
		fields: Event.fields,
        isA: ["Thing", "Event", "Festival"],
        itemTypeURL: "http://schema.org/Festival"
	},
	FoodEvent = exports.FoodEvent = {
		fields: Event.fields,
        isA: ["Thing", "Event", "FoodEvent"],
        itemTypeURL: "http://schema.org/FoodEvent"
	},
	LiteraryEvent = exports.LiteraryEvent = {
		fields: Event.fields,
        isA: ["Thing", "Event", "LiteraryEvent"],
        itemTypeURL: "http://schema.org/LiteraryEvent"
	},
	MusicEvent = exports.MusicEvent = {
		fields: Event.fields,
        isA: ["Thing", "Event", "MusicEvent"],
        itemTypeURL: "http://schema.org/MusicEvent"
	},
	SaleEvent = exports.SaleEvent = {
		fields: Event.fields,
        isA: ["Thing", "Event", "SaleEvent"],
        itemTypeURL: "http://schema.org/SaleEvent"
	},
	SocialEvent = exports.SocialEvent = {
		fields: Event.fields,
        isA: ["Thing", "Event", "SocialEvent"],
        itemTypeURL: "http://schema.org/SocialEvent"
	},
	SportsEvent = exports.SportsEvent = {
		fields: Event.fields,
        isA: ["Thing", "Event", "SportsEvent"],
        itemTypeURL: "http://schema.org/SportsEvent"
	},
	TheaterEvent = exports.TheaterEvent = {
		fields: Event.fields,
        isA: ["Thing", "Event", "TheaterEvent"],
        itemTypeURL: "http://schema.org/TheaterEvent"
	},
	UserInteraction = exports.UserInteraction = {
		fields: Event.fields,
        isA: ["Thing", "Event", "UserInteraction"],
        itemTypeURL: "http://schema.org/UserInteraction"
	},
	UserBlocks = exports.UserBlocks = {
		fields: Event.fields,
        isA: ["Thing", "Event", "UserInteraction", "UserBlocks"],
        itemTypeURL: "http://schema.org/UserBlocks"
	},
	UserCheckins = exports.UserCheckins = {
		fields: Event.fields,
        isA: ["Thing", "Event", "UserInteraction", "UserCheckins"],
        itemTypeURL: "http://schema.org/UserCheckins"
	},
	UserCheckins = exports.UserCheckins = {
		fields: Event.fields,
        isA: ["Thing", "Event", "UserInteraction", "UserCheckins"],
        itemTypeURL: "http://schema.org/UserCheckins"
	},
	UserComments = exports.UserComments = {
		fields: Event.fields,
        isA: ["Thing", "Event", "UserInteraction", "UserComments"],
        itemTypeURL: "http://schema.org/UserComments"
	},	
	UserDownloads = exports.UserDownloads = {
		fields: Event.fields,
        isA: ["Thing", "Event", "UserInteraction", "UserDownloads"],
        itemTypeURL: "http://schema.org/UserDownloads"
	},	
	UserLikes = exports.UserLikes = {
		fields: Event.fields,
        isA: ["Thing", "Event", "UserInteraction", "UserLikes"],
        itemTypeURL: "http://schema.org/UserLikes"
	},
	UserPageVisits = exports.UserPageVisits = {
		fields: Event.fields,
        isA: ["Thing", "Event", "UserInteraction", "UserPageVisits"],
        itemTypeURL: "http://schema.org/UserPageVisits"
	},
	UserPlays = exports.UserPlays = {
		fields: Event.fields,
        isA: ["Thing", "Event", "UserInteraction", "UserPlays"],
        itemTypeURL: "http://schema.org/UserPlays"
	},
	UserPlusOnes = exports.UserPlusOnes = {
		fields: Event.fields,
        isA: ["Thing", "Event", "UserInteraction", "UserPlusOnes"],
        itemTypeURL: "http://schema.org/UserPlusOnes"
	},	
	UserTweets = exports.UserTweets = {
		fields: Event.fields,
        isA: ["Thing", "Event", "UserInteraction", "UserTweets"],
        itemTypeURL: "http://schema.org/UserTweets"
	},	
	VisualArtsEvent = exports.VisualArtsEvent = {
		fields: Event.fields,
        isA: ["Thing", "Event", "VisualArtsEvent"],
        itemTypeURL: "http://schema.org/VisualArtsEvent"
	},
    Enumeration = exports.Enumeration = {
    	fields: Thing.fields,
        isA: ["Thing", "Intangible", "Enumeration"],
        itemTypeURL: "http://schema.org/Enumeration"    	
    },
    BookFormatType = exports.BookFormatType = {
    	fields: Thing.fields,
        isA: ["Thing", "Intangible", "Enumeration", "BookFormatType"],
        itemTypeURL: "http://schema.org/BookFormatType"    	
    },
    BookFormatType = exports.BookFormatType = {
    	fields: combineFields(BookFormatType.fields, { bookFormat: "eBook"}),
        isA: ["Thing", "Intangible", "Enumeration", "BookFormatType", "EBook"],
        itemTypeURL: "http://schema.org/BookFormatType"    	
    },
    EBook = exports.EBook = {
    	fields: Thing.fields,
        isA: ["Thing", "Intangible", "Enumeration", "BookFormatType", "EBook"],
        itemTypeURL: "http://schema.org/EBook"    	
    },
	Hardcover = exports.Hardcover = {
    	fields: Thing.fields,
        isA: ["Thing", "Intangible", "Enumeration", "BookFormatType", "Hardcover"],
        itemTypeURL: "http://schema.org/Hardcover"    	
    },
	Paperback = exports.Paperback = {
    	fields: Thing.fields,
        isA: ["Thing", "Intangible", "Enumeration", "BookFormatType", "Paperback"],
        itemTypeURL: "http://schema.org/Paperback"    	
    },
	ItemAvailability = exports.ItemAvailability = {
    	fields: Thing.fields,
        isA: ["Thing", "Intangible", "Enumeration", "ItemAvailability"],
        itemTypeURL: "http://schema.org/ItemAvailability"    	
    },
	Discontinued = exports.Discontinued = {
    	fields: Thing.fields,
        isA: ["Thing", "Intangible", "Enumeration", "ItemAvailability", "Discontinued"],
        itemTypeURL: "http://schema.org/Discontinued"    	
    },
	InStock = exports.InStock = {
    	fields: Thing.fields,
        isA: ["Thing", "Intangible", "Enumeration", "ItemAvailability", "InStock"],
        itemTypeURL: "http://schema.org/InStock"    	
    },
	InStoreOnly = exports.InStoreOnly = {
    	fields: Thing.fields,
        isA: ["Thing", "Intangible", "Enumeration", "ItemAvailability", "InStoreOnly"],
        itemTypeURL: "http://schema.org/InStoreOnly"    	
    },
	OnlineOnly = exports.OnlineOnly = {
    	fields: Thing.fields,
        isA: ["Thing", "Intangible", "Enumeration", "ItemAvailability", "OnlineOnly"],
        itemTypeURL: "http://schema.org/OnlineOnly"    	
    },
	OutOfStock = exports.OutOfStock = {
    	fields: Thing.fields,
        isA: ["Thing", "Intangible", "Enumeration", "ItemAvailability", "OutOfStock"],
        itemTypeURL: "http://schema.org/OutOfStock"    	
    },
	PreOrder = exports.PreOrder = {
    	fields: Thing.fields,
        isA: ["Thing", "Intangible", "Enumeration", "ItemAvailability", "PreOrder"],
        itemTypeURL: "http://schema.org/PreOrder"    	
    },
	OfferItemCondition = exports.OfferItemCondition = {
    	fields: Thing.fields,
        isA: ["Thing", "Intangible", "Enumeration", "OfferItemCondition"],
        itemTypeURL: "http://schema.org/OfferItemCondition"    	
    },
	DamagedCondition = exports.DamagedCondition = {
    	fields: Thing.fields,
        isA: ["Thing", "Intangible", "Enumeration", "OfferItemCondition", "DamagedCondition"],
        itemTypeURL: "http://schema.org/DamagedCondition"    	
    },
	NewCondition = exports.NewCondition = {
    	fields: Thing.fields,
        isA: ["Thing", "Intangible", "Enumeration", "OfferItemCondition", "NewCondition"],
        itemTypeURL: "http://schema.org/NewCondition"    	
    },
	RefurbishedCondition = exports.RefurbishedCondition = {
    	fields: Thing.fields,
        isA: ["Thing", "Intangible", "Enumeration", "OfferItemCondition", "RefurbishedCondition"],
        itemTypeURL: "http://schema.org/RefurbishedCondition"    	
    },
	UsedCondition = exports.UsedCondition = {
    	fields: Thing.fields,
        isA: ["Thing", "Intangible", "Enumeration", "OfferItemCondition", "UsedCondition"],
        itemTypeURL: "http://schema.org/UsedCondition"    	
    },
	JobPosting = exports.JobPosting = {
    	fields: combineFields(Thing.fields, {
    		baseSalary: "Number",
    		benefits: "Text",
    		datePosted: "Date",
    		educationRequirements: "Text",
    		employmentType: "Text",
    		experienceRequirements: "Text",
    		hiringOrganization: "Organization",
    		incentives: "Text",
    		industry: "Text",
    		jobLocation: "Place",
    		occupationalCategory: "Text",
    		qualifications: "Text",
    		responsibilities: "Text",
    		salaryCurrency: "Text",
    		skills: "Text",
    		specialCommitments: "Text",
    		title: "Text",
    		workHours: "Text"
    	}),
        isA: ["Thing", "Intangible", "JobPosting"],
        itemTypeURL: "http://schema.org/JobPosting"    	
    },
	Language = exports.Language = {
    	fields: Thing.fields,
        isA: ["Thing", "Intangible", "Language"],
        itemTypeURL: "http://schema.org/Language"    	
    },
	Offer = exports.Offer = {
    	fields: combineFields(Thing.fields, {
    		aggregateRating: "AggregateRating",
    		availability: "ItemAvailability",
    		itemCondition: "OfferItemCondition",
    		itemOffered: "Product",
    		price: "Number||Text",
    		priceCurrency: "Text",
    		priceValidUntil: "Date",
    		reviews: "Review",
    		seller: "Organization"
    	}),
        isA: ["Thing", "Intangible", "Offer"],
        itemTypeURL: "http://schema.org/Offer"    	
    },
	AggregateOffer = exports.AggregateOffer = {
    	fields: combineFields(Offer.fields, {
    		highPrice: "Number||Text",
    		lowPrice: "Number||Text",
    		offerCount: "Integer"
    	}),
        isA: ["Thing", "Intangible", "Offer", "AggregateOffer"],
        itemTypeURL: "http://schema.org/AggregateOffer"    	
    },
	Quantity = exports.Quantity = {
    	fields: Thing.fields,
        isA: ["Thing", "Intangible", "Quantity"],
        itemTypeURL: "http://schema.org/Quantity"    	
    },
	Distance = exports.Distance = {
    	fields: Thing.fields,
        isA: ["Thing", "Intangible", "Quantity", "Distance"],
        itemTypeURL: "http://schema.org/Distance"    	
    },
	Duration = exports.Duration = {
    	fields: Thing.fields,
        isA: ["Thing", "Intangible", "Quantity", "Duration"],
        itemTypeURL: "http://schema.org/Duration"    	
    },
	Energy = exports.Energy = {
    	fields: Thing.fields,
        isA: ["Thing", "Intangible", "Quantity", "Energy"],
        itemTypeURL: "http://schema.org/Energy"    	
    },
	Mass = exports.Mass = {
    	fields: Thing.fields,
        isA: ["Thing", "Intangible", "Quantity", "Mass"],
        itemTypeURL: "http://schema.org/Mass"    	
    },
	Rating = exports.Rating = {
    	fields: combineFields(Thing.fields, {
    		bestRating: "Number||Text",
    		ratingValue: "Text",
    		worstRating: "Number||Text",
    	}),
        isA: ["Thing", "Intangible", "Rating"],
        itemTypeURL: "http://schema.org/Rating"    	
    },
	AggregateRating = exports.AggregateRating = {
    	fields: combineFields(Rating.fields, {
    		itemReviewed: "Thing",
    		ratingCount: "Number",
    		reviewCount: "Number"
    	}),
        isA: ["Thing", "Intangible", "Rating", "AggregateRating"],
        itemTypeURL: "http://schema.org/AggregateRating"    	
    },
    StructuredValue = exports.StructuredValue = {
    	fields: Thing.fields,
        isA: ["Thing", "Intangible","StructuredValue"],
        itemTypeURL: "http://schema.org/StructuredValue"    	
    },
    ContactPoint = exports.ContactPoint = {
    	fields: combineFields(StructuredValue.fields, {
    		contactType: "Text",
    		email: "Text",
    		faxNumber: "Text",
    		telephone: "Text"
    	}),
    	isA: ["Thing", "Intangible", "StructuredValue", "ContactPoint"],
    	itemTypeURL: "http://schema.org/ContactPoint"
    },
    PostalAddress = exports.PostalAddress = {
    	fields: combineFields(ContactPoint.fields, {
    		addressCountry: "Country",
    		addressLocality: "Text",
    		addressRegion: "Text",
    		postOfficeBoxNumber: "Text",
    		postalCode: "Text",
    		streetAddress: "Text"
    	}),
    	isA: ["Thing", "Intangible", "StructuredValue", "ContactPoint", "PostalAddress"],
    	itemTypeURL: "http://schema.org/PostalAddress"
    },
    GeoCoordinates = exports.GeoCoordinates = {
    	fields: combineFields(Thing.fields, {
    		elevation: "Number||Text",
    		latitude: "Number||Text",
    		longitude: "Number||Text"
    	}),
    	isA: ["Thing", "Intangible", "StructuredValue", "GeoCoordinates"],
    	itemTypeURL: "http://schema.org/GeoCoordinates"
    },
    GeoShape = exports.GeoShape = {
    	fields: combineFields(Thing.fields, {
    		box: "Text",
    		circle: "Text",
    		elevation: "Number||Text",
    		line: "Text",
    		polygon: "Text"
    	}),
    	isA: ["Thing", "Intangible", "StructuredValue", "GeoShape"],
    	itemTypeURL: "http://schema.org/GeoShape"
    },
    NutritionInformation = exports.NutritionInformation = {
    	fields: combineFields(Thing.fields, {
    		calories: "Energy",
    		carbohydrateContent: "Mass",
    		cholesterolContent: "Mass",
    		fatContent: "Mass",
    		fiberContent: "Mass",
    		proteinContent: "Mass",
    		saturatedFatContent: "Mass",
    		servingSize: "Text",
    		sodiumContent: "Mass",
    		sugarContent: "Mass",
    		transFatContent: "Mass",
    		unsaturatedFatContent: "Mass"
    	}),
    	isA: ["Thing", "Intangible", "StructuredValue", "NutritionInformation"],
    	itemTypeURL: "http://schema.org/NutritionInformation"
    },
    Organization = exports.Organization = {
    	fields: combineFields(Thing.fields, {
    		address: "PostalAddress",
    		aggregateRating: "AggregateRating",
    		contactPoints: "ContactPoint",
    		email: "Text",
    		employees: "Person",
    		events: "Event",
    		faxNumber: "Text",
    		founders: "Person",
    		foundingDate: "Date",
    		interactionCount: "Text",
    		location: "Place||PostalAddress",
    		members: "Person||Organization",
    		reviews: "Review",
    		telephone: "Text"
    	}),
        isA: ["Thing", "Organization"],
        itemTypeURL: "http://schema.org/Organization"    
    },
    Corporation = exports.Corporation = {
    	fields: combineFields(Organization.fields, {
    		tickerSymbol: "Text"
    	}),
        isA: ["Thing", "Organization", "Corporation"],
        itemTypeURL: "http://schema.org/Corporation"    
    },
    EducationalOrganization = exports.EducationalOrganization = {
    	fields: combineFields(Organization.fields, {
    		alumni: "Person"
    	}),
        isA: ["Thing", "Organization", "EducationalOrganization"],
        itemTypeURL: "http://schema.org/EducationalOrganization"    
    },
    GovernmentOrganization = exports.GovernmentOrganization = {
    	fields: Organization.fields,
        isA: ["Thing", "Organization", "GovernmentOrganization"],
        itemTypeURL: "http://schema.org/GovernmentOrganization"    
    },
    LocalBusiness = exports.LocalBusiness = {
    	fields: combineFields(Organization.fields, Place.fields, {
    		branchOf: "Organization",
    		currenciesAccepted: "Text",
    		openingHours: "Duration",
    		paymentAccepted: "Text",
    		priceRange: "Text"
    	}),
        isA: ["Thing", "Organization", "LocalBusiness"],
        itemTypeURL: "http://schema.org/LocalBusiness"    
    },
    AnimalShelter = exports.AnimalShelter = {
    	fields: LocalBusiness.fields,
        isA: ["Thing", "Organization", "LocalBusiness", "AnimalShelter"],
        itemTypeURL: "http://schema.org/AnimalShelter"    
    },
    AutomotiveBusiness = exports.AutomotiveBusiness = {
    	fields: LocalBusiness.fields,
        isA: ["Thing", "Organization", "LocalBusiness", "AutomotiveBusiness"],
        itemTypeURL: "http://schema.org/AutomotiveBusiness"    
    },
    AutoBodyShop = exports.AutoBodyShop = {
    	fields: LocalBusiness.fields,
        isA: ["Thing", "Organization", "LocalBusiness", "AutomotiveBusiness", "AutoBodyShop"],
        itemTypeURL: "http://schema.org/AutoBodyShop"    
    },
    AutoDealer = exports.AutoDealer = {
    	fields: LocalBusiness.fields,
        isA: ["Thing", "Organization", "LocalBusiness", "AutomotiveBusiness", "AutoDealer"],
        itemTypeURL: "http://schema.org/AutoDealer"    
    },
    AutoPartsStore = exports.AutoPartsStore = {
    	fields: LocalBusiness.fields,
        isA: ["Thing", "Organization", "LocalBusiness", "Store", "AutoPartsStore"],
        itemTypeURL: "http://schema.org/AutoPartsStore"    
    },
    AutoRental = exports.AutoRental = {
    	fields: LocalBusiness.fields,
        isA: ["Thing", "Organization", "LocalBusiness", "AutomotiveBusiness", "AutoRental"],
        itemTypeURL: "http://schema.org/AutoRental"    
    },
    AutoRepair = exports.AutoRepair = {
    	fields: LocalBusiness.fields,
        isA: ["Thing", "Organization", "LocalBusiness", "AutomotiveBusiness", "AutoRepair"],
        itemTypeURL: "http://schema.org/AutoRepair"    
    },
    AutoWash = exports.AutoWash = {
    	fields: LocalBusiness.fields,
        isA: ["Thing", "Organization", "LocalBusiness", "AutomotiveBusiness", "AutoWash"],
        itemTypeURL: "http://schema.org/AutoWash"    
    },
    GasStation = exports.GasStation = {
    	fields: LocalBusiness.fields,
        isA: ["Thing", "Organization", "LocalBusiness", "AutomotiveBusiness", "GasStation"],
        itemTypeURL: "http://schema.org/GasStation"    
    },
    MotorcycleDealer = exports.MotorcycleDealer = {
    	fields: LocalBusiness.fields,
        isA: ["Thing", "Organization", "LocalBusiness", "AutomotiveBusiness", "MotorcycleDealer"],
        itemTypeURL: "http://schema.org/MotorcycleDealer"    
    },
    MotorcycleRepair = exports.MotorcycleRepair = {
    	fields: LocalBusiness.fields,
        isA: ["Thing", "Organization", "LocalBusiness", "AutomotiveBusiness", "MotorcycleRepair"],
        itemTypeURL: "http://schema.org/MotorcycleRepair"    
    },
    ChildCare = exports.ChildCare = {
    	fields: LocalBusiness.fields,
        isA: ["Thing", "Organization", "LocalBusiness", "ChildCare"],
        itemTypeURL: "http://schema.org/ChildCare"    
    },
    DryCleaningOrLaundry = exports.DryCleaningOrLaundry = {
    	fields: LocalBusiness.fields,
        isA: ["Thing", "Organization", "LocalBusiness", "DryCleaningOrLaundry"],
        itemTypeURL: "http://schema.org/DryCleaningOrLaundry"    
    },
    EmergencyService = exports.EmergencyService = {
    	fields: LocalBusiness.fields,
        isA: ["Thing", "Organization", "LocalBusiness", "EmergencyService"],
        // FIXME: Do we need a child list? PoliceStation, FireStation, Hospital are linked from Emergency Service but are defined under CivicStructure and MedicalOrganization
        itemTypeURL: "http://schema.org/EmergencyService"    
    },
    FireStation = exports.FireStation = {
    	fields: combineFields(LocalBusiness.fields, CivicStructure.fields),
        isA: ["Thing", "Organization", "LocalBusiness", "CivicStructure","FireStation"],
        itemTypeURL: "http://schema.org/FireStation"    
    },
    Hospital = exports.Hospital = {
    	fields: combineFields(LocalBusiness.fields, CivicStructure.fields),
        isA: ["Thing", "Organization", "LocalBusiness", "MedicalOrganization","FireStation"],
        itemTypeURL: "http://schema.org/Hospital"    
    },
    PoliceStation = exports.PoliceStation = {
    	fields: combineFields(LocalBusiness.fields, CivicStructure.fields),
        isA: ["Thing", "Organization", "LocalBusiness", "CivicStructure", "PoliceStation"],
        itemTypeURL: "http://schema.org/PoliceStation"    
    },
    EmploymentAgency = exports.EmploymentAgency = {
    	fields: LocalBusiness.fields,
        isA: ["Thing", "Organization", "LocalBusiness", "EmploymentAgency"],
        itemTypeURL: "http://schema.org/EmploymentAgency"    
    },
    EntertainmentBusiness = exports.EntertainmentBusiness = {
    	fields: LocalBusiness.fields,
        isA: ["Thing", "Organization", "LocalBusiness", "EntertainmentBusiness"],
        itemTypeURL: "http://schema.org/EntertainmentBusiness"    
    },
    AdultEntertainment = exports.AdultEntertainment = {
    	fields: LocalBusiness.fields,
        isA: ["Thing", "Organization", "LocalBusiness", "EntertainmentBusiness", "AdultEntertainment"],
        itemTypeURL: "http://schema.org/AdultEntertainment"    
    },
    AmusementPark = exports.AmusementPark = {
    	fields: LocalBusiness.fields,
        isA: ["Thing", "Organization", "LocalBusiness", "EntertainmentBusiness", "AmusementPark"],
        itemTypeURL: "http://schema.org/AmusementPark"    
    },
    ArtGallery = exports.ArtGallery = {
    	fields: LocalBusiness.fields,
   		isA: ["Thing", "Organization", "LocalBusiness", "EntertainmentBusiness", "ArtGallery"],
        itemTypeURL: "http://schema.org/ArtGallery"    
    },
    Casino = exports.Casino = {
    	fields: LocalBusiness.fields,
        isA: ["Thing", "Organization", "LocalBusiness", "EntertainmentBusiness", "Casino"],
        itemTypeURL: "http://schema.org/Casino"    
    },
    ComedyClub = exports.ComedyClub = {
    	fields: LocalBusiness.fields,
        isA: ["Thing", "Organization", "LocalBusiness", "EntertainmentBusiness", "ComedyClub"],
        itemTypeURL: "http://schema.org/ComedyClub"    
    },
    MovieTheater = exports.MovieTheater = {
    	fields: combineFields(LocalBusiness.fields, CivicStructure.fields),
        isA: ["Thing", "Organization", "LocalBusiness", "EntertainmentBusiness", "MovieTheater"],
        itemTypeURL: "http://schema.org/MovieTheater"    
    },
    NightClub = exports.NightClub = {
    	fields: LocalBusiness.fields,
        isA: ["Thing", "Organization", "LocalBusiness", "EntertainmentBusiness", "NightClub"],
        itemTypeURL: "http://schema.org/NightClub"    
    },
    FinancialService = exports.FinancialService = {
    	fields: LocalBusiness.fields,
        isA: ["Thing", "Organization", "LocalBusiness", "FinancialService"],
        itemTypeURL: "http://schema.org/FinancialService"    
    },
    AccountingService = exports.AccountingService = {
    	fields: LocalBusiness.fields,
        isA: ["Thing", "Organization", "LocalBusiness", "FinancialService", "AccountingService"],
        itemTypeURL: "http://schema.org/AccountingService"    
    },
    AutomatedTeller = exports.AutomatedTeller = {
    	fields: LocalBusiness.fields,
        isA: ["Thing", "Organization", "LocalBusiness", "FinancialService", "AutomatedTeller"],
        itemTypeURL: "http://schema.org/AutomatedTeller"    
    },
    BankOrCreditUnion = exports.BankOrCreditUnion = {
    	fields: LocalBusiness.fields,
        isA: ["Thing", "Organization", "LocalBusiness", "FinancialService", "BankOrCreditUnion"],
        itemTypeURL: "http://schema.org/BankOrCreditUnion"    
    },
    InsuranceAgency = exports.InsuranceAgency = {
    	fields: LocalBusiness.fields,
        isA: ["Thing", "Organization", "LocalBusiness", "FinancialService", "InsuranceAgency"],
        itemTypeURL: "http://schema.org/InsuranceAgency"    
    },
    FoodEstablishment = exports.FoodEstablishment = {
    	fields: combineFields(LocalBusiness.fields, {
    		acceptsReservations: "Text||URL",
    		menu: "Text||URL",
    		servesCuisine: "Text"
    	}),
        isA: ["Thing", "Organization", "LocalBusiness", "FoodEstablishment"],
        itemTypeURL: "http://schema.org/FoodEstablishment"    
    },
    Bakery = exports.Bakery = {
    	fields: FoodEstablishment.fields,
        isA: ["Thing", "Organization", "LocalBusiness", "FoodEstablishment", "Bakery"],
        itemTypeURL: "http://schema.org/FoodEstablishment"    
    },
    BarOrPub = exports.BarOrPub = {
    	fields: FoodEstablishment.fields,
        isA: ["Thing", "Organization", "LocalBusiness", "FoodEstablishment", "BarOrPub"],
        itemTypeURL: "http://schema.org/BarOrPub"    
    },
    Brewery = exports.Brewery = {
    	fields: FoodEstablishment.fields,
        isA: ["Thing", "Organization", "LocalBusiness", "FoodEstablishment", "Brewery"],
        itemTypeURL: "http://schema.org/Brewery"    
    },
    CafeOrCoffeeShop = exports.CafeOrCoffeeShop = {
    	fields: FoodEstablishment.fields,
        isA: ["Thing", "Organization", "LocalBusiness", "FoodEstablishment", "CafeOrCoffeeShop"],
        itemTypeURL: "http://schema.org/CafeOrCoffeeShop"    
    },
    FastFoodRestaurant = exports.FastFoodRestaurant = {
    	fields: FoodEstablishment.fields,
        isA: ["Thing", "Organization", "LocalBusiness", "FoodEstablishment", "FastFoodRestaurant"],
        itemTypeURL: "http://schema.org/FastFoodRestaurant"    
    },
    IceCreamShop = exports.IceCreamShop = {
    	fields: FoodEstablishment.fields,
        isA: ["Thing", "Organization", "LocalBusiness", "FoodEstablishment", "IceCreamShop"],
        itemTypeURL: "http://schema.org/IceCreamShop"    
    },
    Restaurant = exports.Restaurant = {
    	fields: FoodEstablishment.fields,
        isA: ["Thing", "Organization", "LocalBusiness", "FoodEstablishment", "Restaurant"],
        itemTypeURL: "http://schema.org/Restaurant"    
    },
    Winery = exports.Winery = {
    	fields: FoodEstablishment.fields,
        isA: ["Thing", "Organization", "LocalBusiness", "FoodEstablishment", "Winery"],
        itemTypeURL: "http://schema.org/Winery"    
    },
    GovernmentOffice = exports.GovernmentOffice = {
    	fields: LocalBusiness.fields,
        isA: ["Thing", "Organization", "LocalBusiness", "GovernmentOffice"],
        itemTypeURL: "http://schema.org/GovernmentOffice"    
    },
    PostOffice = exports.PostOffice = {
    	fields: LocalBusiness.fields,
        isA: ["Thing", "Organization", "LocalBusiness", "GovernmentOffice", "PostOffice"],
        itemTypeURL: "http://schema.org/PostOffice"    
    },
    HealthAndBeautyBusiness = exports.HealthAndBeautyBusiness = {
    	fields: LocalBusiness.fields,
        isA: ["Thing", "Organization", "LocalBusiness", "HealthAndBeautyBusiness"],
        itemTypeURL: "http://schema.org/HealthAndBeautyBusiness"    
    },
    BeautySalon = exports.BeautySalon = {
    	fields: LocalBusiness.fields,
        isA: ["Thing", "Organization", "LocalBusiness", "HealthAndBeautyBusiness", "BeautySalon"],
        itemTypeURL: "http://schema.org/BeautySalon"    
    },
    DaySpa = exports.DaySpa = {
    	fields: LocalBusiness.fields,
        isA: ["Thing", "Organization", "LocalBusiness", "HealthAndBeautyBusiness", "DaySpa"],
        itemTypeURL: "http://schema.org/DaySpa"    
    },
    HairSalon = exports.HairSalon = {
    	fields: LocalBusiness.fields,
        isA: ["Thing", "Organization", "LocalBusiness", "HealthAndBeautyBusiness", "HairSalon"],
        itemTypeURL: "http://schema.org/HairSalon"    
    },
    HealthClub = exports.HealthClub = {
    	fields: LocalBusiness.fields,
        isA: ["Thing", "Organization", "LocalBusiness", "HealthAndBeautyBusiness", "HealthClub"],
        itemTypeURL: "http://schema.org/HealthClub"    
    },
    NailSalon = exports.NailSalon = {
    	fields: LocalBusiness.fields,
        isA: ["Thing", "Organization", "LocalBusiness", "HealthAndBeautyBusiness", "NailSalon"],
        itemTypeURL: "http://schema.org/NailSalon"    
    },
    TattooParlor = exports.TattooParlor = {
    	fields: LocalBusiness.fields,
        isA: ["Thing", "Organization", "LocalBusiness", "HealthAndBeautyBusiness", "TattooParlor"],
        itemTypeURL: "http://schema.org/TattooParlor"    
    },
    HomeAndConstructionBusiness = exports.HomeAndConstructionBusiness = {
    	fields: LocalBusiness.fields,
        isA: ["Thing", "Organization", "LocalBusiness", "HomeAndConstructionBusiness"],
        itemTypeURL: "http://schema.org/HomeAndConstructionBusiness"    
    },
    Electrician = exports.Electrician = {
    	fields: LocalBusiness.fields,
        isA: ["Thing", "Organization", "LocalBusiness", "HomeAndConstructionBusiness","Electrician"],
        itemTypeURL: "http://schema.org/Electrician"    
    },
    GeneralContractor = exports.GeneralContractor = {
    	fields: LocalBusiness.fields,
        isA: ["Thing", "Organization", "LocalBusiness", "HomeAndConstructionBusiness","GeneralContractor"],
        itemTypeURL: "http://schema.org/GeneralContractor"    
    },
    HVACBusiness = exports.HVACBusiness = {
    	fields: LocalBusiness.fields,
        isA: ["Thing", "Organization", "LocalBusiness", "HomeAndConstructionBusiness","HVACBusiness"],
        itemTypeURL: "http://schema.org/HVACBusiness"    
    },
    HousePainter = exports.HousePainter = {
    	fields: LocalBusiness.fields,
        isA: ["Thing", "Organization", "LocalBusiness", "HomeAndConstructionBusiness","HousePainter"],
        itemTypeURL: "http://schema.org/HousePainter"    
    },
    Locksmith = exports.Locksmith = {
    	fields: LocalBusiness.fields,
        isA: ["Thing", "Organization", "LocalBusiness", "HomeAndConstructionBusiness","Locksmith"],
        itemTypeURL: "http://schema.org/Locksmith"    
    },
    MovingCompany = exports.MovingCompany = {
    	fields: LocalBusiness.fields,
        isA: ["Thing", "Organization", "LocalBusiness", "HomeAndConstructionBusiness","MovingCompany"],
        itemTypeURL: "http://schema.org/MovingCompany"    
    },
    Plumber = exports.Plumber = {
    	fields: LocalBusiness.fields,
        isA: ["Thing", "Organization", "LocalBusiness", "HomeAndConstructionBusiness","Plumber"],
        itemTypeURL: "http://schema.org/Plumber"    
    },
    RoofingContractor = exports.RoofingContractor = {
    	fields: LocalBusiness.fields,
        isA: ["Thing", "Organization", "LocalBusiness", "HomeAndConstructionBusiness","RoofingContractor"],
        itemTypeURL: "http://schema.org/RoofingContractor"    
    },
    InternetCafe = exports.InternetCafe = {
        fields: LocalBusiness.fields,
        isA: ["Thing", "Organization", "LocalBusiness", "InternetCafe"],
        itemTypeURL: "http://schema.org/InternetCafe"    
    },
    Library = exports.Library = {
        fields: LocalBusiness.fields,
        isA: ["Thing", "Organization", "LocalBusiness", "Library"],
        itemTypeURL: "http://schema.org/Library"    
    },
    LodgingBusiness = exports.LodgingBusiness = {
        fields: LocalBusiness.fields,
        isA: ["Thing", "Organization", "LocalBusiness", "LodgingBusiness"],
        itemTypeURL: "http://schema.org/LodgingBusiness"    
    },
    LodgBedAndBreakfastingBusiness = exports.BedAndBreakfast = {
        fields: LocalBusiness.fields,
        isA: ["Thing", "Organization", "LocalBusiness", "LodgingBusiness", "BedAndBreakfast"],
        itemTypeURL: "http://schema.org/BedAndBreakfast"
    },
    Hostel = exports.Hostel = {
        fields: LocalBusiness.fields,
        isA: ["Thing", "Organization", "LocalBusiness", "LodgingBusiness", "Hostel"],
        itemTypeURL: "http://schema.org/BedAndBreakfast"
    },
    Hotel = exports.Hotel = {
        fields: LocalBusiness.fields,
        isA: ["Thing", "Organization", "LocalBusiness", "LodgingBusiness", "Hotel"],
        itemTypeURL: "http://schema.org/Hotel"
    },
    Motel = exports.Motel = {
        fields: LocalBusiness.fields,
        isA: ["Thing", "Organization", "LocalBusiness", "LodgingBusiness", "Motel"],
        itemTypeURL: "http://schema.org/Motel"
    },
    MedicalOrganization = exports.MedicalOrganization = {
        fields: LocalBusiness.fields,
        isA: ["Thing", "Organization", "LocalBusiness", "MedicalOrganization"],
        itemTypeURL: "http://schema.org/MedicalOrganization"
    },
    Dentist = exports.Dentist = {
        fields: LocalBusiness.fields,
        isA: ["Thing", "Organization", "LocalBusiness", "MedicalOrganization", "Dentist"],
        itemTypeURL: "http://schema.org/Dentist"
    },
    MedicalClinic = exports.MedicalClinic = {
        fields: LocalBusiness.fields,
        isA: ["Thing", "Organization", "LocalBusiness", "MedicalOrganization", "MedicalClinic"],
        itemTypeURL: "http://schema.org/MedicalClinic"
    },
    Optician = exports.Optician = {
        fields: LocalBusiness.fields,
        isA: ["Thing", "Organization", "LocalBusiness", "MedicalOrganization", "Optician"],
        itemTypeURL: "http://schema.org/Optician"
    },
    Pharmacy = exports.Pharmacy = {
        fields: LocalBusiness.fields,
        isA: ["Thing", "Organization", "LocalBusiness", "MedicalOrganization", "Pharmacy"],
        itemTypeURL: "http://schema.org/Pharmacy"
    },
    Physician = exports.Physician = {
        fields: LocalBusiness.fields,
        isA: ["Thing", "Organization", "LocalBusiness", "MedicalOrganization", "Physician"],
        itemTypeURL: "http://schema.org/Physician"
    },
    VeterinaryCare = exports.VeterinaryCare = {
        fields: LocalBusiness.fields,
        isA: ["Thing", "Organization", "LocalBusiness", "MedicalOrganization", "VeterinaryCare"],
        itemTypeURL: "http://schema.org/VeterinaryCare"
    },
    ProfessionalService = exports.ProfessionalService = {
        fields: LocalBusiness.fields,
        isA: ["Thing", "Organization", "LocalBusiness", "ProfessionalService"],
        itemTypeURL: "http://schema.org/ProfessionalService"
    },
    Attorney = exports.Attorney = {
        fields: LocalBusiness.fields,
        isA: ["Thing", "Organization", "LocalBusiness", "ProfessionalService", "Attorney"],
        itemTypeURL: "http://schema.org/Attorney"
    },
    Notary = exports.Notary = {
        fields: LocalBusiness.fields,
        isA: ["Thing", "Organization", "LocalBusiness", "ProfessionalService", "Notary"],
        itemTypeURL: "http://schema.org/Notary"
    },
    RadioStation = exports.RadioStation = {
        fields: LocalBusiness.fields,
        isA: ["Thing", "Organization", "LocalBusiness", "RadioStation"],
        itemTypeURL: "http://schema.org/Notary"
    },
    RealEstateAgent = exports.RealEstateAgent = {
        fields: LocalBusiness.fields,
        isA: ["Thing", "Organization", "LocalBusiness", "RealEstateAgent"],
        itemTypeURL: "http://schema.org/RealEstateAgent"
    },
    RecyclingCenter = exports.RecyclingCenter = {
        fields: LocalBusiness.fields,
        isA: ["Thing", "Organization", "LocalBusiness", "RecyclingCenter"],
        itemTypeURL: "http://schema.org/RecyclingCenter"
    },
    SelfStorage = exports.SelfStorage = {
        fields: LocalBusiness.fields,
        isA: ["Thing", "Organization", "LocalBusiness", "SelfStorage"],
        itemTypeURL: "http://schema.org/SelfStorage"
    },
    ShoppingCenter = exports.ShoppingCenter = {
        fields: LocalBusiness.fields,
        isA: ["Thing", "Organization", "LocalBusiness", "ShoppingCenter"],
        itemTypeURL: "http://schema.org/ShoppingCenter"
    },
    SportsActivityLocation = exports.SportsActivityLocation = {
        fields: LocalBusiness.fields,
        isA: ["Thing", "Organization", "LocalBusiness", "SportsActivityLocation"],
        itemTypeURL: "http://schema.org/SportsActivityLocation"
    },
    BowlingAlley = exports.BowlingAlley = {
        fields: LocalBusiness.fields,
        isA: ["Thing", "Organization", "LocalBusiness", "SportsActivityLocation", "BowlingAlley"],
        itemTypeURL: "http://schema.org/BowlingAlley"
    },
    ExerciseGym = exports.ExerciseGym = {
        fields: LocalBusiness.fields,
        isA: ["Thing", "Organization", "LocalBusiness", "SportsActivityLocation", "ExerciseGym"],
        itemTypeURL: "http://schema.org/ExerciseGym"
    },
    GolfCourse = exports.GolfCourse = {
        fields: LocalBusiness.fields,
        isA: ["Thing", "Organization", "LocalBusiness", "SportsActivityLocation", "GolfCourse"],
        itemTypeURL: "http://schema.org/GolfCourse"
    },
    PublicSwimmingPool = exports.PublicSwimmingPool = {
        fields: LocalBusiness.fields,
        isA: ["Thing", "Organization", "LocalBusiness", "SportsActivityLocation", "PublicSwimmingPool"],
        itemTypeURL: "http://schema.org/PublicSwimmingPool"
    },
    SkiResort = exports.SkiResort = {
        fields: LocalBusiness.fields,
        isA: ["Thing", "Organization", "LocalBusiness", "SportsActivityLocation", "SkiResort"],
        itemTypeURL: "http://schema.org/SkiResort"
    },
    SportsClub = exports.SportsClub = {
        fields: LocalBusiness.fields,
        isA: ["Thing", "Organization", "LocalBusiness", "SportsActivityLocation", "SportsClub"],
        itemTypeURL: "http://schema.org/SportsClub"
    },
    StadiumOrArena = exports.StadiumOrArena = {
        fields: combineFields(LocalBusiness.fields, CivicStructure.fields),
        isA: ["Thing", "Organization", "LocalBusiness", "SportsActivityLocation", "StadiumOrArena"],
        itemTypeURL: "http://schema.org/StadiumOrArena"
    },
    TennisComplex = exports.TennisComplex = {
        fields: LocalBusiness.fields,
        isA: ["Thing", "Organization", "LocalBusiness", "SportsActivityLocation", "TennisComplex"],
        itemTypeURL: "http://schema.org/TennisComplex"
    },
    Store = exports.Store = {
        fields: LocalBusiness.fields,
        isA: ["Thing", "Organization", "LocalBusiness", "Store"],
        itemTypeURL: "http://schema.org/Store"
    },
    BikeStore = exports.BikeStore = {
        fields: LocalBusiness.fields,
        isA: ["Thing", "Organization", "LocalBusiness", "Store", "BikeStore"],
        itemTypeURL: "http://schema.org/BikeStore"
    },
    BookStore = exports.BookStore = {
        fields: LocalBusiness.fields,
        isA: ["Thing", "Organization", "LocalBusiness", "Store", "BookStore"],
        itemTypeURL: "http://schema.org/BookStore"
    },
    ClothingStore = exports.ClothingStore = {
        fields: LocalBusiness.fields,
        isA: ["Thing", "Organization", "LocalBusiness", "Store", "ClothingStore"],
        itemTypeURL: "http://schema.org/ClothingStore"
    },
    ComputerStore = exports.ComputerStore = {
        fields: LocalBusiness.fields,
        isA: ["Thing", "Organization", "LocalBusiness", "Store", "ComputerStore"],
        itemTypeURL: "http://schema.org/ComputerStore"
    },
    ConvenienceStore = exports.ConvenienceStore = {
        fields: LocalBusiness.fields,
        isA: ["Thing", "Organization", "LocalBusiness", "Store", "ConvenienceStore"],
        itemTypeURL: "http://schema.org/ConvenienceStore"
    },
    DepartmentStore = exports.DepartmentStore = {
        fields: LocalBusiness.fields,
        isA: ["Thing", "Organization", "LocalBusiness", "Store", "DepartmentStore"],
        itemTypeURL: "http://schema.org/DepartmentStore"
    },
    ElectronicsStore = exports.ElectronicsStore = {
        fields: LocalBusiness.fields,
        isA: ["Thing", "Organization", "LocalBusiness", "Store", "ElectronicsStore"],
        itemTypeURL: "http://schema.org/ElectronicsStore"
    },
    Florist = exports.Florist = {
        fields: LocalBusiness.fields,
        isA: ["Thing", "Organization", "LocalBusiness", "Store", "Florist"],
        itemTypeURL: "http://schema.org/Florist"
    },
    FurnitureStore = exports.FurnitureStore = {
        fields: LocalBusiness.fields,
        isA: ["Thing", "Organization", "LocalBusiness", "Store", "FurnitureStore"],
        itemTypeURL: "http://schema.org/FurnitureStore"
    },
    GardenStore = exports.GardenStore = {
        fields: LocalBusiness.fields,
        isA: ["Thing", "Organization", "LocalBusiness", "Store", "GardenStore"],
        itemTypeURL: "http://schema.org/GardenStore"
    },
    GroceryStore = exports.GroceryStore = {
        fields: LocalBusiness.fields,
        isA: ["Thing", "Organization", "LocalBusiness", "Store", "GroceryStore"],
        itemTypeURL: "http://schema.org/GroceryStore"
    },
    HardwareStore = exports.HardwareStore = {
        fields: LocalBusiness.fields,
        isA: ["Thing", "Organization", "LocalBusiness", "Store", "HardwareStore"],
        itemTypeURL: "http://schema.org/HardwareStore"
    },
    HobbyShop = exports.HobbyShop = {
        fields: LocalBusiness.fields,
        isA: ["Thing", "Organization", "LocalBusiness", "Store", "HobbyShop"],
        itemTypeURL: "http://schema.org/HobbyShop"
    },
    HomeGoodsStore = exports.HomeGoodsStore = {
        fields: LocalBusiness.fields,
        isA: ["Thing", "Organization", "LocalBusiness", "Store", "HomeGoodsStore"],
        itemTypeURL: "http://schema.org/HomeGoodsStore"
    },
    JewelryStore = exports.JewelryStore = {
        fields: LocalBusiness.fields,
        isA: ["Thing", "Organization", "LocalBusiness", "Store", "JewelryStore"],
        itemTypeURL: "http://schema.org/JewelryStore"
    },
    LiquorStore = exports.LiquorStore = {
        fields: LocalBusiness.fields,
        isA: ["Thing", "Organization", "LocalBusiness", "Store", "LiquorStore"],
        itemTypeURL: "http://schema.org/LiquorStore"
    },
    MensClothingStore = exports.MensClothingStore = {
        fields: LocalBusiness.fields,
        isA: ["Thing", "Organization", "LocalBusiness", "Store", "MensClothingStore"],
        itemTypeURL: "http://schema.org/MensClothingStore"
    },
    MobilePhoneStore = exports.MobilePhoneStore = {
        fields: LocalBusiness.fields,
        isA: ["Thing", "Organization", "LocalBusiness", "Store", "MobilePhoneStore"],
        itemTypeURL: "http://schema.org/MobilePhoneStore"
    },
    MovieRentalStore = exports.MovieRentalStore = {
        fields: LocalBusiness.fields,
        isA: ["Thing", "Organization", "LocalBusiness", "Store", "MovieRentalStore"],
        itemTypeURL: "http://schema.org/MovieRentalStore"
    },
    MusicStore = exports.MusicStore = {
        fields: LocalBusiness.fields,
        isA: ["Thing", "Organization", "LocalBusiness", "Store", "MusicStore"],
        itemTypeURL: "http://schema.org/MusicStore"
    },
    OfficeEquipmentStore = exports.OfficeEquipmentStore = {
        fields: LocalBusiness.fields,
        isA: ["Thing", "Organization", "LocalBusiness", "Store", "OfficeEquipmentStore"],
        itemTypeURL: "http://schema.org/OfficeEquipmentStore"
    },
    OutletStore = exports.OutletStore = {
        fields: LocalBusiness.fields,
        isA: ["Thing", "Organization", "LocalBusiness", "Store", "OutletStore"],
        itemTypeURL: "http://schema.org/OutletStore"
    },
    PawnShop = exports.PawnShop = {
        fields: LocalBusiness.fields,
        isA: ["Thing", "Organization", "LocalBusiness", "Store", "PawnShop"],
        itemTypeURL: "http://schema.org/PawnShop"
    },
    PetStore = exports.PetStore = {
        fields: LocalBusiness.fields,
        isA: ["Thing", "Organization", "LocalBusiness", "Store", "PetStore"],
        itemTypeURL: "http://schema.org/PetStore"
    },
    ShoeStore = exports.ShoeStore = {
        fields: LocalBusiness.fields,
        isA: ["Thing", "Organization", "LocalBusiness", "Store", "ShoeStore"],
        itemTypeURL: "http://schema.org/ShoeStore"
    },
    SportingGoodsStore = exports.SportingGoodsStore = {
        fields: LocalBusiness.fields,
        isA: ["Thing", "Organization", "LocalBusiness", "Store", "SportingGoodsStore"],
        itemTypeURL: "http://schema.org/SportingGoodsStore"
    },
    TireShop = exports.TireShop = {
        fields: LocalBusiness.fields,
        isA: ["Thing", "Organization", "LocalBusiness", "Store", "TireShop"],
        itemTypeURL: "http://schema.org/TireShop"
    },
    ToyStore = exports.ToyStore = {
        fields: LocalBusiness.fields,
        isA: ["Thing", "Organization", "LocalBusiness", "Store", "ToyStore"],
        itemTypeURL: "http://schema.org/ToyStore"
    },
    WholesaleStore = exports.WholesaleStore = {
        fields: LocalBusiness.fields,
        isA: ["Thing", "Organization", "LocalBusiness", "Store", "WholesaleStore"],
        itemTypeURL: "http://schema.org/WholesaleStore"
    };// 
    
// FIXME: Need to figure out browser/MongoDB Shell
// equivalent of NodeJS' exports.
Object.keys(exports).forEach(function (item) {
	if (exports[item].fields !== undefined) {
		exports[item].create = create;
		exports[item].toHandlebars = toHandlebars;
	}
});
