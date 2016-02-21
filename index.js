#!/usr/bin/env node

'use strict';

var bluebird = require('bluebird');
var del = bluebird.promisify(require('del'));
var exec = bluebird.promisify(require('child_process').exec);
var config = require('@tridnguyen/config');
var path = require('path');
var watchr = require('watchr');
var Queue = require('sync-queue');

var argv = require('yargs')
.usage('Usage: $0 <command> [options]')
.command('delete', 'Delete a file or cartridge')
.command('watch', 'Watch for file changes')
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
.version(function () {
	return require('./package').version;
})
.argv;
var conf = {};
var dwjson = config('dw.json', {caller: false});
// manually iterating through config and argv to override them as
// yargs instantiate options with `undefined`, which would overwrite
// the values from dwjson
Object.keys(argv).forEach(function (prop) {
	if (argv[prop]) {
		conf[prop] = argv[prop];
	} else if (dwjson[prop]) {
		conf[prop] = dwjson[prop];
	}
});

if (!conf.file && !conf.cartridge) {
	console.error('Error: either a file or cartridge must be declared.');
	process.exit(1);
}

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
if (command === 'watch') {
	var queue = new Queue();
	watchr.watch({
		paths: toUploads,
		ignoreHiddenFiles: true,
		listener: function (changeType, filePath) {
			switch (changeType) {
			case 'update':
			case 'create':
				queue.place(function () {
					uploadFile(filePath)
					.then(function () {
						queue.next();
					}, function (err) {
						console.error(err);
						queue.next();
					});
				});
				break;
			case 'delete':
				queue.place(function () {
					deleteFile(filePath)
					.then(function () {
						queue.next();
					}, function (err) {
						console.error(err);
						queue.next();
					});
				});
				break;
			}
		}
	});
} else {
	toUploads.reduce(function (acc, toUpload) {
		return acc.then(function () {
			return action(toUpload);
		});
	}, Promise.resolve())
	.then(function () {
		console.log('Done!');
		process.exit();
	}, function (err) {
		console.error(err);
		process.exit(1);
	});
}

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
		console.log('Successfully uploaded: ' + file);
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
