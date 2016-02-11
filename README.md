# dwupload
> Upload a storefront cartridge to a Demandware WebDAV server from command line.

## Installation

```shell
:; npm install bitbucket:demandware/dwupload
```

*Note: this npm command above requires the lastest version of npm (or at least 2.x). If you do not have that, run `npm install -g npm` first.*

## Usage

```shell
:; dwupload --hostname example.demandware.net --username admin --password password --cartridge app_storefront_core # uploading a carridge
:; dwupload --file path/to/app.js --file path/to/style.css # uploading file(s) using configuration in `dw.json`
```

### Options

- `hostname`: sandbox URL (without the `https://`)
- `username` and `password`: credentials to log into sandbox
- `version`: default to `version1`
- `file`: path to file to upload to. This is best used at the parent directory of a cartridge.
- `cartridge`: cartridge name, for e.g. `app_storefront_core`. If this option is used, any `file` declared will be ignored

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

## TODO
- Add the ability to upload individual file instead of the whole cartridge
