//
// objectid_test.js - test the generated MongoDB style object ids
//
// @author: R. S. Doiel, <rsdoiel@gmail.com>
// copyright (c) 2011 all rights reserved
//
// Released under New the BSD License.
// See: http://opensource.org/licenses/bsd-license.php
//
// revision: 0.0.0f-experiment
//

var assert = require('assert'),
	objectids = require('./objectids'),
	ObjIds = objectids.ObjectIds;

// FIXME: want to replace _id with something more Mongo like for object id.
