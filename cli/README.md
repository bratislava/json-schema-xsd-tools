# json-schema-xsd-tools CLI (jsxt)

[![npm](https://img.shields.io/npm/v/@bratislava/jsxt)](https://www.npmjs.com/package/@bratislava/jsxt)

## Installation

`yarn global add @bratislava/jsxt`

or

`npm i -g @bratislava/jsxt`

## Get started

run `jsxt <command> [options]`

In case of `command not found`, try running using npx - `npx jsxt <command> [options]`

CLI provides these commands:

- `generate` - generate whole form (XSD, stylesheets, some mock data) from JSON schema
- `generate-xsd` - generate XSD from JSON schema
- `generate-text-xslt` - generate text stylesheet from JSON schema
- `generate-html-xslt` - generate html stylesheet from JSON schema
- `generate-pdf-xslt` - generate pdf stylesheet from JSON schema
- `fake-data` - generate mock data from JSON schema
- `validate` - validate XSD against JSON schema

## Options

### -j, --json

JSON schema path

### -x, --xsd

XSD path

### -o, --out

output path, default form.\* (extension is defined by used command)

## Documentation

Explore the [docs](https://bratislava.github.io/json-schema-xsd-tools/).

## Publishing new version

[![Publish cli package](https://github.com/bratislava/json-schema-xsd-tools/actions/workflows/publish-cli.yml/badge.svg?event=push)](https://github.com/bratislava/json-schema-xsd-tools/actions/workflows/publish-cli.yml)

- Run `npm version [<newversion> | major | minor | patch | premajor | preminor | prepatch | prerelease | from-git]`
- Or you can update the version manually in [package.json](package.json) and create a tag with prefix `cli-v`.
- Push changes.
- [Action](https://github.com/bratislava/json-schema-xsd-tools/actions/workflows/publish-cli.yml) publish package to npm. Check the status of workflow run.

## License

[EUPL-1.2](https://github.com/bratislava/json-schema-xsd-tools/blob/master/LICENSE.md)
