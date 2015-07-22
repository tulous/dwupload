#!/usr/bin/env node

'use strict';

var bluebird = require('bluebird');
var del = bluebird.promisify(require('del'));
var exec = bluebird.promisify(require('child_process').exec);
var assign = require('lodash.assign');
var minimist = require('minimist');
var config = require('@tridnguyen/config');

var argv = minimist(process.argv.slice(2));
var conf = assign(config({
	cartridge: 'app_storefront_core'
}, 'dw.json', {caller: false}), argv);
var dwdav = require('dwdav')(conf);

return dwdav.delete(config.cartridge)
	.then(function () {
		return exec('zip -r ' + config.cartridge + '.zip ' + config.cartridge);
	}).then(function () {
		return dwdav.postAndUnzip(config.cartridge + '.zip');
	}).then(function () {
		return del(config.cartridge + '.zip');
	}).then(function () {
		return dwdav.delete(config.cartridge + '.zip');
	}).then(function () {
		console.log('Done uploading cartridge ' + config.cartridge);
	}).catch(function (err) {
		throw err;
	});

