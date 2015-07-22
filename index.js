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

return dwdav.delete(conf.cartridge)
	.then(function () {
		return exec('zip -r ' + conf.cartridge + '.zip ' + conf.cartridge);
	}).then(function () {
		return dwdav.postAndUnzip(conf.cartridge + '.zip');
	}).then(function () {
		return del(conf.cartridge + '.zip');
	}).then(function () {
		return dwdav.delete(conf.cartridge + '.zip');
	}).then(function () {
		console.log('Done uploading cartridge ' + conf.cartridge);
	}).catch(function (err) {
		console.error(err);
	});

