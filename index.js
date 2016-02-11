#!/usr/bin/env node

'use strict';

var bluebird = require('bluebird');
var del = bluebird.promisify(require('del'));
var exec = bluebird.promisify(require('child_process').exec);
var assign = require('lodash.assign');
var minimist = require('minimist');
var config = require('@tridnguyen/config');
var path = require('path');

var argv = minimist(process.argv.slice(2));
var conf = assign(config('dw.json', {caller: false}), argv);
var dwdav = require('dwdav')(conf);
var isCartridge = Boolean(conf.cartridge);
// having a cartridge flag will override file flag
var toUploads = [].concat(isCartridge ? conf.cartridge : conf.file);

Promise.all(toUploads.map(isCartridge ? uploadCartridge : uploadFile))
.then(function () {
	console.log('Done!');
	process.exit();
}, function (err) {
	console.error(err);
	process.exit(1);
});

function uploadFile (file) {
	return dwdav.delete(file)
	.then(function () {
		return dwdav.post(file);
	}).then(function () {
		console.log('Uploaded file: ' + file);
	});
}

function uploadCartridge (cartridge) {
	var dirname = path.dirname(cartridge);
	var cwd = process.cwd();
	var cartridgeName = path.basename(cartridge);
	var zipCartridgeName = cartridgeName + '.zip';

	return dwdav.delete(cartridgeName)
	.then(function () {
		if (dirname === '.') {
			return bluebird.resolve();
		}
		// change directory into dirname in order to create the correct zip archive
		try {
			process.chdir(dirname);
			return bluebird.resolve();
		} catch (err) {
			return bluebird.reject(err);
		}
	}).then(function () {
		return exec('zip -r ' + zipCartridgeName + ' ' + cartridgeName);
	}).then(function () {
		return dwdav.postAndUnzip(zipCartridgeName);
	}).then(function () {
		return del(zipCartridgeName);
	}).then(function () {
		return dwdav.delete(zipCartridgeName);
	}).then(function () {
		if (dirname === '.') {
			return bluebird.resolve();
		}
		// go back to cwd
		try {
			process.chdir(cwd);
			return bluebird.resolve();
		} catch (err) {
			return bluebird.reject(err);
		}
	}).then(function () {
		console.log('Uploaded cartridge: ' + cartridge);
	});
}

