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
var conf = assign(config({
	cartridge: 'app_storefront_core'
}, 'dw.json', {caller: false}), argv);
var dwdav = require('dwdav')(conf);

var dirname = path.dirname(conf.cartridge);
var cwd = process.cwd();
var cartridgeName = path.basename(conf.cartridge);
var zipCartridgeName = cartridgeName + '.zip';

return dwdav.delete(conf.cartridge)
	.then(function () {
		if (dirname == '.') {
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
		if (dirname == '.') {
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
		console.log('Done uploading cartridge: ' + conf.cartridge);
	}).catch(function (err) {
		console.error(err);
	});

