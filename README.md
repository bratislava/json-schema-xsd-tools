# json-schema-xsd-tools

<!-- [![npm](https://img.shields.io/npm/v/json-schema-xsd-tools)](https://www.npmjs.com/package/json-schema-xsd-tools) -->

Tools capable of using JSON Schema to generate and validate XSD.

JSON Schema is a vocabulary that allows to annotate and validate JSON documents.
Read more about [JSON Schema](https://json-schema.org/).

## Installation

### lib

- run `yarn add @bratislava/json-schema-xsd-tools` or `npm i @bratislava/json-schema-xsd-tools`

### CLI

- Clone or download this repository.
- run `yarn` or `npm install`
- run `yarn run build` or `npm run build`
- run `npm install -g .`

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

## Documentation

Explore the [docs](https://bratislava.github.io/json-schema-xsd-tools/).

## License

[EUPL-1.2](https://github.com/bratislava/json-schema-xsd-tools/blob/master/LICENSE.md)
