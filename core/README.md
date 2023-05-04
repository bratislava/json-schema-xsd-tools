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

## Documentation

Explore the [docs](https://bratislava.github.io/json-schema-xsd-tools/).

## License

[EUPL-1.2](https://github.com/bratislava/json-schema-xsd-tools/blob/master/LICENSE.md)
