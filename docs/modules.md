[JSON schema XSD tools - v0.1.0](README.md) / Exports

# JSON schema XSD tools - v0.1.0

## Table of contents

### Enumerations

- [ErrorType](enums/ErrorType.md)

### Interfaces

- [Error](interfaces/Error.md)
- [JsonSchema](interfaces/JsonSchema.md)
- [JsonSchemaItems](interfaces/JsonSchemaItems.md)
- [JsonSchemaProperties](interfaces/JsonSchemaProperties.md)
- [Options](interfaces/Options.md)

### Type Aliases

- [JsonSchemaFormat](modules.md#jsonschemaformat)
- [JsonSchemaType](modules.md#jsonschematype)

### Functions

- [loadAndBuildJsonSchema](modules.md#loadandbuildjsonschema)
- [loadAndBuildXsd](modules.md#loadandbuildxsd)
- [loadAndValidate](modules.md#loadandvalidate)

## Type Aliases

### JsonSchemaFormat

Ƭ **JsonSchemaFormat**: ``"date"`` \| ``"date-time"`` \| ``"data-url"`` \| ``"ciselnik"`` \| `undefined`

#### Defined in

utils/forms.ts:14

___

### JsonSchemaType

Ƭ **JsonSchemaType**: ``"string"`` \| ``"number"`` \| ``"boolean"`` \| ``"object"`` \| ``"array"`` \| ``"null"``

#### Defined in

utils/forms.ts:13

## Functions

### loadAndBuildJsonSchema

▸ **loadAndBuildJsonSchema**(`xsdSchema`): [`JsonSchema`](interfaces/JsonSchema.md)

Loads XSD and returns generated JSON schema.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `xsdSchema` | `string` | XSD schema |

#### Returns

[`JsonSchema`](interfaces/JsonSchema.md)

JSON schema

#### Defined in

utils/forms.ts:187

___

### loadAndBuildXsd

▸ **loadAndBuildXsd**(`jsonSchema`, `xsd`): `string`

Loads JSON schema and returns generated XSD.

**`Remarks`**

Form is generated into Body element of XSD template:
```xml
<xs:element name="E-form">
  <xs:complexType>
    <xs:sequence>
      <xs:element name="Meta" type="E-formMetaType"/>
      <xs:element name="Body" type="E-formBodyType"/>
    </xs:sequence>
  </xs:complexType>
</xs:element>
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `jsonSchema` | [`JsonSchema`](interfaces/JsonSchema.md) | JSON schema |
| `xsd` | `string` | XSD template including E-form metadata and some basic types (EnumerationType, PrilohaType) |

#### Returns

`string`

XSD schema

#### Defined in

utils/forms.ts:322

___

### loadAndValidate

▸ **loadAndValidate**(`xsd`, `jsonSchema`, `options?`): [`Error`](interfaces/Error.md)[]

Validate JSON schema against XSD and return list of errors

#### Parameters

| Name | Type | Default value | Description |
| :------ | :------ | :------ | :------ |
| `xsd` | `string` | `undefined` | XSD schema |
| `jsonSchema` | [`JsonSchema`](interfaces/JsonSchema.md) | `undefined` | JSON schema |
| `options` | `undefined` \| [`Options`](interfaces/Options.md) | `undefined` | Options object |

#### Returns

[`Error`](interfaces/Error.md)[]

List of errors, empty array if JSON schema is valid

#### Defined in

utils/validation.ts:158
