JSON schema XSD tools - v0.1.0 / [Exports](modules.md)

# json-schema-xsd-tools
<!-- [![npm](https://img.shields.io/npm/v/json-schema-xsd-tools)](https://www.npmjs.com/package/json-schema-xsd-tools) -->

Tools capable of using JSON Schema to generate and validate XSD.

JSON Schema is a vocabulary that allows to annotate and validate JSON documents.
Read more about [JSON Schema](https://json-schema.org/).

## Installation
In a browser:

`<script src="dist/json-schema-xsd-tools.js"></script>`

Using yarn:

`yarn add json-schema-xsd-tools`

Usign npm:

`npm install json-schema-xsd-tools`

## Get started
```ts
import { loadAndBuildXsd, loadAndValidate } from "json-schema-xsd-tools";
import { readFile } from "node:fs/promises";

const jsonSchema = {
  title: "A registration form",
  description: "A simple form example.",
  type: "object",
  required: ["firstName", "lastName"],
  properties: {
    firstName: {
      type: "string",
      title: "First name",
      default: "Chuck",
    },
    lastName: {
      type: "string",
      title: "Last name",
    },
    telephone: {
      type: "string",
      title: "Telephone",
      minLength: 10,
    },
  },
};

const templatePath = "template.xsd";
const templateBuffer = await readFile(templatePath)
const xsd = loadAndBuildXsd(jsonSchema, templateBuffer.toString())

const errors = loadAndValidate(xsd, jsonSchema);
console.log(errors) // => [] 
```

XSD template includes E-form metadata and some basic types (EnumerationType, PrilohaType), see [template.xsd](forms/00603481.dopravneZnacenie.sk/template.xsd)

## Documentation
Explore the [docs](docs/modules.md)

## License
[EUPL-1.2](LICENSE)
