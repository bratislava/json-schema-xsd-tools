# json-schema-xsd-tools

[![npm](https://img.shields.io/npm/v/@bratislava/json-schema-xsd-tools)](https://www.npmjs.com/package/@bratislava/json-schema-xsd-tools)

Tools capable of using JSON Schema to generate and validate XSD.

JSON Schema is a vocabulary that allows to annotate and validate JSON documents.
Read more about [JSON Schema](https://json-schema.org/).

## Installation

`yarn add @bratislava/json-schema-xsd-tools`

or

`npm i @bratislava/json-schema-xsd-tools`

## Get started

### using lib

```ts
import { loadAndBuildXsd, loadAndBuildDefaultXslt, loadAndValidate, fakeData } from 'json-schema-xsd-tools'
import { readFile, writeFile } from 'node:fs/promises'

const jsonSchema = {
  title: 'A registration form',
  description: 'A simple form example.',
  type: 'object',
  required: ['firstName', 'lastName'],
  properties: {
    firstName: {
      type: 'string',
      title: 'First name',
      default: 'Chuck',
    },
    lastName: {
      type: 'string',
      title: 'Last name',
    },
    telephone: {
      type: 'string',
      title: 'Telephone',
      minLength: 10,
    },
  },
}

const xsd = loadAndBuildXsd(jsonSchema)
await writeFile('schema.xsd', xsd)

const xslt = loadAndBuildDefaultXslt(jsonSchema, 'text')
await writeFile('form.sb.xslt', xslt)

const data = fakeData(jsonSchema)
await writeFile('form.json', data)

const errors = loadAndValidate(xsd, jsonSchema)
console.log(errors) // => []
```

### using CLI

run `json-schema-xsd-tools <command> [options]`

In case of `command not found`, try running using npx - `npx json-schema-xsd-tools <command> [options]`

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

## Publishing new version

[![Publish Package to npm](https://github.com/bratislava/json-schema-xsd-tools/actions/workflows/publish.yml/badge.svg?event=release)](https://github.com/bratislava/json-schema-xsd-tools/actions/workflows/publish.yml)
[![npm](https://img.shields.io/npm/v/@bratislava/json-schema-xsd-tools)](https://www.npmjs.com/package/@bratislava/json-schema-xsd-tools)

- Update the version in [package.json](package.json). Follow [Semantic Versioning Specification](https://semver.org/).
- Create a new [release](https://github.com/bratislava/json-schema-xsd-tools/releases/new).
- [Publish action](https://github.com/bratislava/json-schema-xsd-tools/actions/workflows/publish.yml) publish package to npm automatically. Check the status of workflow run.

## Documentation

Explore the [docs](https://bratislava.github.io/json-schema-xsd-tools/).

## License

[EUPL-1.2](https://github.com/bratislava/json-schema-xsd-tools/blob/master/LICENSE.md)
