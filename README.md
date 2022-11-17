# json-schema-xsd-tools
<!-- [![npm](https://img.shields.io/npm/v/json-schema-xsd-tools)](https://www.npmjs.com/package/json-schema-xsd-tools) -->

Tools capable of using JSON Schema to generate and validate XSD.


JSON Schema is a vocabulary that allows to annotate and validate JSON documents.
Read more about [JSON Schema](https://json-schema.org/).


## Installation
- Clone or download this repository.
- run `yarn` or `npm install`
- run `yarn run build` or `npm run build`
- For using CLI, run `npm install -g .`
- Navigate to your app.
- run `npm install <path to json-schema-xsd-tools folder>`

<!--
In a browser:

`<script src="dist/json-schema-xsd-tools.js"></script>`

Using yarn:

`yarn add json-schema-xsd-tools`

Usign npm:

`npm install json-schema-xsd-tools`
-->

## Get started
### using lib
```ts
import { loadAndBuildXsd, loadAndBuildDefaultXslt, loadAndValidate } from "json-schema-xsd-tools";
import { readFile, writeFile } from "node:fs/promises";

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

const xsd = loadAndBuildXsd(jsonSchema)
await writeFile("schema.xsd", xsd)

const xslt = loadAndBuildDefaultXslt(jsonSchema, "text")
await writeFile("form.sb.xslt", xslt)

const errors = loadAndValidate(xsd, jsonSchema);
console.log(errors) // => [] 
```

### using CLI
run `json-schema-xsd-tools <command> [options]` 

In case of `command not found`, try running using npx - `npx json-schema-xsd-tools <command> [options]`

CLI provides these commands:
- `generate-xsd` - generate XSD from JSON schema 
- `generate-text-xslt` - generate text stylesheet from JSON schema
- `generate-html-xslt` - generate html stylesheet from JSON schema
- `generate-pdf-xslt` - generate pdf stylesheet from JSON schema
- `validate` - validate XSD against JSON schema

## Options
### -j, --json
JSON schema path

### -t, --template
XSD template path, default 'template.xsd'

### -x, --xsd 
XSD path, default 'schema.xsd'

### -x, --xslt
XSLT path, default 'form.xslt'

## Documentation
Explore the [docs](https://bratislava.github.io/json-schema-xsd-tools/).


## License
[EUPL-1.2](https://github.com/bratislava/json-schema-xsd-tools/blob/master/LICENSE.md)
