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

var zipCartridgeName = path.basename(conf.cartridge) + '.zip';

return dwdav.delete(conf.cartridge)
	.then(function () {
		return exec('zip -r ' + zipCartridgeName + ' ' + conf.cartridge);
	}).then(function () {
		return dwdav.postAndUnzip(zipCartridgeName);
	}).then(function () {
		return del(zipCartridgeName);
	}).then(function () {
		return dwdav.delete(zipCartridgeName);
	}).then(function () {
		console.log('Done uploading cartridge: ' + conf.cartridge);
	}).catch(function (err) {
		console.error(err);
	});

