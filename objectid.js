//
// objectid.js - generate MongoDB style object ids
//
// @author: R. S. Doiel, <rsdoiel@gmail.com>
// copyright (c) 2011 all rights reserved
//
// Released under New the BSD License.
// See: http://opensource.org/licenses/bsd-license.php
//
// revision: 0.0.0f-experiment
//

// Create a global object for use in browser, export for NodeJS
(function () {
	var global = this;

	var create = function (host_ip) {
		var self = {};

		// 4 byte from Unix Timestamp
		self._unixtime = Number(new Date());

		// 3 byte from machine id (what about the browser?)
		if (process === undefined) {
			if (host_ip === undefined) {
				throw "Missing host IP address";
			} else {
				self._ip = Number(host_ip.replace(/\./g,''));
			}
		} else {
			if (host_ip === undefined) {
				self._ip = Number(process.env.smart.replace(/\./g,''));
			} else {
				self._ip = Number(host_ip.replace(/\./g,''));
			}
		}

		// 2 bye from process id
		self._pid = Number(process.pid);

		// 3 byte counter
		self._inc = 0;

		var lastId = function () {
			return this._inc;
		};
		var newId = function () {
			this._inc = (this._inc + 1) % 8;
			return this._inc;
		};
		self.prototype.lastId = lastId;
		self.prototype.newId = newId;

		return self;
	};

	if (exports === undefined) {
        global.create = create;
    } else {
		exports.create = create;
    }
}());
