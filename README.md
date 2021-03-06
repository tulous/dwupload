# dwupload
> Upload a storefront cartridge to a Demandware WebDAV server from command line.

## Installation

```shell
:; npm install -g bitbucket:demandware/dwupload
```

Instead of installing this as a global npm package, you can install it locally and access it as `./node_modules/.bin/dwupload`.

*Note: this npm command above requires the lastest version of npm (or at least 2.x). If you do not have that, run `npm install -g npm` first.*

## Usage

```shell
:; dwupload --hostname example.demandware.net --username admin --password password --cartridge app_storefront_core # uploading a carridge
:; dwupload --file path/to/app.js --file path/to/style.css # uploading file(s) using configuration in `dw.json`
:; dwupload watch --cartridge app_storefront_controllers # watch for file changes and upload automatically
```

See `--help` for more information.

## Config file
Instead of passing command line options every single time, you can store your config options in a `dw.json` file in the current working directory instead. For example:

```js
{
        "hostname": "example.demandware.net",
        "username": "user",
        "password": "password"
}
```

Command line options will always override the options delcared in the config file.
