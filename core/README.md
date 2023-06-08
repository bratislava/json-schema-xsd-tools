# json-schema-xsd-tools

[![npm](https://img.shields.io/npm/v/@bratislava/json-schema-xsd-tools)](https://www.npmjs.com/package/@bratislava/json-schema-xsd-tools)

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

## Publishing new version

[![Publish core package](https://github.com/bratislava/json-schema-xsd-tools/actions/workflows/publish-core.yml/badge.svg?event=push)](https://github.com/bratislava/json-schema-xsd-tools/actions/workflows/publish-core.yml)

- Run `npm version [<newversion> | major | minor | patch | premajor | preminor | prepatch | prerelease | from-git]`
- Or update the version manually in [package.json](package.json) and create a tag with prefix `core-v`.
- Push changes.
- [Action](https://github.com/bratislava/json-schema-xsd-tools/actions/workflows/publish-core.yml) publish package to npm. Check the status of workflow run.

## License

[EUPL-1.2](https://github.com/bratislava/json-schema-xsd-tools/blob/master/LICENSE.md)
