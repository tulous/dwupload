#!/usr/bin/env node

'use strict';

var bluebird = require('bluebird');
var del = bluebird.promisify(require('del'));
var exec = bluebird.promisify(require('child_process').exec);
var config = require('@tridnguyen/config');
var path = require('path');

var argv = require('yargs')
.usage('Usage: $0 <command> [options]')
.command('delete', 'Delete a file or cartridge')
.options({
	'file': {
		alias: 'f',
		describe: 'File to upload/ delete'
	},
	'cartridge': {
		alias: 'c',
		describe: 'Cartridge to upload/ delete. If this option is used, any "file" declard will be ignored.'
	},
	'username': {
		describe: 'Username to log into sandbox'
	},
	'password': {
		describe: 'Password to log into sandbox'
	},
	'hostname': {
		describe: 'Sandbox URL (without the "https://" prefix)'
	},
	'version': {
		describe: 'Code version',
		default: 'version1'
	}
})
.help('h')
.alias('h', 'help')
.argv;
var conf = Object.assign({}, config('dw.json', {caller: false}), argv);
var dwdav = require('dwdav')(conf);
var isCartridge = Boolean(conf.cartridge);
var command = argv._[0];
// having a cartridge flag will override file flag
var toUploads = [].concat(isCartridge ? conf.cartridge : conf.file);

var action;

if (command === 'delete') {
	action = deleteFile;
} else {
	if (isCartridge) {
		action = uploadCartridge;
	} else {
		action = uploadFile;
	}
}

Promise.all(toUploads.map(action))
.then(function () {
	console.log('Done!');
	process.exit();
}, function (err) {
	console.error(err);
	process.exit(1);
});

function deleteFile (filePath) {
	return dwdav.delete(filePath)
	.then(function () {
		console.log('Successfully deleted: ' + filePath);
	});
}

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
	}, function (err) {
		// delete local zip when there's an error with the upload
		return del(zipCartridgeName)
		.then(function () {
			// pass the error along
			bluebird.reject(err);
		});
	});
}

