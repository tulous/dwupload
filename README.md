# dwupload
> Upload a storefront cartridge to a Demandware WebDAV server from command line.

## Installation

```sh
:; npm install bitbucket:demandware/dwupload
```

## Usage

```sh
:; dwupload --hostname example.demandware.net --username admin --password password --cartridge app_storefront_core
```

### Options

- `hostname`: sandbox URL (without the `https://`)
- `username` and `password`: credentials to log into sandbox
- `version`: default to `version1`
- `cartridge`: cartridge name, default to `app_storefront_core`

## Config file
Instead of passing command line options every single time, you can store your config options in a `dw.json` file instead. For example:

```js
{
        "hostname": "example.demandware.net",
        "username": "user",
        "password": "password"
}
```

Command line options will always override the options delcared in the config file.
