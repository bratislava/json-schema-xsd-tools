import * as cheerio from 'cheerio'
import { JSONSchemaFaker as jsf } from 'json-schema-faker'
import defaultXsdTemplate from '../templates/template.xsd'
import { firstCharToLower, firstCharToUpper } from './strings'

type XsdType =
  | 'xs:string'
  | 'xs:boolean'
  | 'xs:date'
  | 'xs:dateTime'
  | 'PrilohaType'
  | 'EnumerationType'
  | 'xs:integer'
  | ''
export type JsonSchemaType = 'string' | 'number' | 'boolean' | 'object' | 'array' | 'null'
export type JsonSchemaFormat = 'date' | 'date-time' | 'data-url' | 'ciselnik' | undefined

/**
 * JSON schema object
 *
 * Read more about [JSON schema](https://json-schema.org/).
 */
export interface JsonSchema {
  type: JsonSchemaType
  format?: JsonSchemaFormat
  title?: string | undefined
  description?: string | undefined
  properties?: JsonSchemaProperties | undefined
  items?: JsonSchemaItems | undefined
  required?: string[] | undefined
  pattern?: string | undefined
  enum?: string[] | undefined
  then?: JsonSchema | undefined
  oneOf?: JsonSchema[] | undefined
  anyOf?: JsonSchema[] | undefined
  allOf?: JsonSchema[] | undefined
  const?: string
}

export interface JsonSchemaItems {
  type: JsonSchemaType
  format?: JsonSchemaFormat
}

export interface JsonSchemaProperties {
  [key: string]: JsonSchema
}

type JsonSchemaComposition = 'allOf' | 'oneOf' | 'anyOf'

const getJsonSchemaType = (type: string | undefined): JsonSchemaType => {
  switch (type) {
    case 'xs:boolean':
      return 'boolean'
    case 'xs:string':
    case 'xs:date':
    case 'xs:dateTime':
    case 'PrilohaType':
    case 'EnumerationType':
      return 'string'
    case 'xs:integer':
      return 'number'
    default:
      return 'null'
  }
}

const getJsonSchemaFormat = (type: string | undefined): JsonSchemaFormat => {
  switch (type) {
    case 'xs:date':
      return 'date'
    case 'xs:dateTime':
      return 'date-time'
    case 'PrilohaType':
      return 'data-url'
    case 'EnumerationType':
      return 'ciselnik'
    default:
      return undefined
  }
}

/**
 * Merge JSON Schema properties and required fields - merge allOf, oneOf, anyOf and if-then.
 *
 * @remarks
 *
 * It is necessary to guarantee the exact order of properties, as we are using `<xs:sequence>` element in XSD schema.
 *
 * @param jsonSchema - JSON schema
 * @returns merged JSON schema - JSON schema properties and required fields
 */
export const mergeJsonSchema = (jsonSchema: JsonSchema) => {
  const allProperties: JsonSchemaProperties = jsonSchema.properties ?? {}
  const allRequiredFields: string[] = jsonSchema.required ?? []

  if (jsonSchema.then) {
    Object.assign(allProperties, mergeJsonSchema(jsonSchema.then).properties)
  }

  ;['allOf', 'oneOf', 'anyOf'].forEach((c: string) => {
    jsonSchema[c as JsonSchemaComposition]?.forEach((s) => {
      const { properties, required } = mergeJsonSchema(s)
      Object.assign(allProperties, properties)
      allRequiredFields.push(...required)
    })
  })

  return { properties: allProperties, required: allRequiredFields }
}

const enumMap = new Map()
const buildJsonSchemaProperty = ($: cheerio.CheerioAPI, el: cheerio.AnyNode): JsonSchema => {
  const title = $(el).attr('name')
  const type = $(el).attr('type')

  if (!type) {
    const restriction = $(el).find(`xs\\:restriction`)
    return {
      title,
      type: getJsonSchemaType(restriction.attr('base')),
      pattern: $(restriction).children(`xs\\:pattern`).attr('value'),
    }
  } else if (type.startsWith('xs:') || type === 'PrilohaType' || type === 'EnumerationType') {
    return {
      title,
      type: getJsonSchemaType(type),
      format: getJsonSchemaFormat(type),
    }
  } else {
    const simpleType = $(`xs\\:simpleType[name='${type}']`)
    if (simpleType.length) {
      const restriction = simpleType.find(`xs\\:restriction`)
      let enumeration = enumMap.get(type)
      if (!enumeration) {
        enumeration = []
        restriction.children('xs\\:enumeration').each(function () {
          enumeration.push($(this).attr('value'))
        })
        enumMap.set(type, enumeration)
      }

      return {
        title,
        type: getJsonSchemaType(restriction.attr('base')),
        pattern: $(restriction).children(`xs\\:pattern`).attr('value'),
        enum: enumeration.length > 0 ? enumeration : undefined,
      }
    } else {
      const schema = buildJsonSchema($, `xs\\:complexType[name='${type}']`)
      return {
        title,
        type: schema.type,
        description: schema.description,
        properties: schema.properties,
        required: schema.required,
        format: schema.format,
      }
    }
  }
}

export const buildJsonSchema = ($: cheerio.CheerioAPI, path: string): JsonSchema => {
  const properties: JsonSchemaProperties = {}
  const required: string[] = []
  let description
  let isAttachment = false
  let isEnum = false

  const extension = $(`${path} xs\\:extension`)
  if (extension.length) {
    const type = extension.attr('base')
    path = `xs\\:complexType[name='${type}']`

    isEnum = type === 'EnumerationType'
    isAttachment = type === 'PrilohaType'
  }

  const el = $(`${path}`)
  const documentation = el.children(`xs\\:annotation`).children(`xs\\:documentation`)
  if (documentation.length) {
    description = documentation.text()
  }

  const restriction = el.find(`xs\\:restriction`)
  if (restriction.length && restriction.attr('base') === 'EnumerationType') {
    isEnum = true
  }

  if (!isEnum && !isAttachment) {
    el.find(`xs\\:element`).each(function () {
      const property = buildJsonSchemaProperty($, this)
      const key = firstCharToLower(property.title)

      const maxOccurs = $(this).attr('maxOccurs')
      if (maxOccurs === 'unbounded') {
        property.items = { type: property.type, format: property.format }
        property.type = 'array'
        property.format = undefined
      }
      properties[key] = property

      const minOccurs = $(this).attr('minOccurs')
      if (!minOccurs || minOccurs === '1') {
        required.push(key)
      }
    })
  }

  return {
    properties,
    description,
    required,
    type: isEnum || isAttachment ? 'string' : 'object',
    format: isAttachment ? 'data-url' : isEnum ? 'ciselnik' : undefined,
  }
}

/**
 * Loads XSD and returns generated JSON schema.
 *
 * @param xsdSchema - XSD schema
 * @param bodyElement - path to body element in XSD
 * @returns JSON schema
 */
export const loadAndBuildJsonSchema = (xsdSchema: string, bodyElement: string): JsonSchema => {
  const $ = cheerio.load(xsdSchema, { xmlMode: true })
  const jsonSchema = buildJsonSchema($, bodyElement)
  return jsonSchema
}

const getXsdTypeByJsonSchemaType = (type: JsonSchemaType): XsdType => {
  switch (type) {
    case 'boolean':
      return 'xs:boolean'
    case 'string':
      return 'xs:string'
    case 'number':
      return 'xs:integer'
    case 'null':
    default:
      return ''
  }
}

const getXsdTypeByFormat = (format: JsonSchemaFormat): XsdType => {
  switch (format) {
    case 'date':
      return 'xs:date'
    case 'date-time':
      return 'xs:dateTime'
    case 'data-url':
      return 'PrilohaType'
    case 'ciselnik':
      return 'EnumerationType'
    default:
      return 'xs:string'
  }
}

const getXsdType = (
  key: string,
  property: JsonSchema,
  type: JsonSchemaType,
  format: JsonSchemaFormat
): XsdType | string => {
  let xsdType
  if (type === 'string') {
    if (property.pattern || (property.enum && property.enum.length) || (property.oneOf && property.oneOf.length)) {
      xsdType = firstCharToUpper(key) + 'Type'
    } else {
      xsdType = getXsdTypeByFormat(format)
    }
  } else if (type === 'object') {
    xsdType = firstCharToUpper(key) + 'Type'
  } else {
    xsdType = getXsdTypeByJsonSchemaType(type)
  }
  return xsdType
}

/**
 * Elements are generated into `<xs:sequence>` element, so it is necessary to guarantee the exact order of properties.
 *
 * We would like to use `<xs:all>` element (child elements can appear in any order), but child elements can occurs more than one (eg attachments)
 * and attribute maxOccurs is restricted to 1 in child elements (XSD 1.0).
 * {@link https://www.w3.org/TR/xmlschema11-1/#element-all}
 *
 * Hacking `<xs:choice minOccurs="0" maxOccurs="unbounded">` ignores minOccurs and maxOccurs in children. Can not be used.
 * {@link https://stackoverflow.com/questions/2290360/xsd-how-to-allow-elements-in-any-order-any-number-of-times}
 *
 */
const buildXsd = (
  container: cheerio.Cheerio<cheerio.Element>,
  name: string,
  required: string[] | undefined,
  properties: JsonSchemaProperties,
  processed: string[]
) => {
  const content: string[] = []
  content.push(`<xs:complexType name=${name}><xs:sequence>`)

  Object.keys(properties).forEach((key) => {
    const property = properties?.[key]
    const isRequired = required && required.includes(key)

    if (property) {
      const isArray = property.type === 'array'
      const type = isArray && property.items ? property.items.type : property.type
      const format = isArray && property.items ? property.items.format : property.format
      const xsdType = getXsdType(key, property, type, format)

      content.push(
        `<xs:element name="${firstCharToUpper(key)}" type="${xsdType}" minOccurs="${isRequired ? 1 : 0}" maxOccurs="${
          isArray ? 'unbounded' : 1
        }" />`
      )

      if (!processed.includes(xsdType)) {
        processed.push(xsdType)

        if (type === 'object') {
          const mergedSchema = mergeJsonSchema(property)
          buildXsd(container, xsdType, mergedSchema.required, mergedSchema.properties, processed)
        } else if (type === 'string') {
          if (property.enum && property.enum.length > 0) {
            container.append(buildEnumSimpleType(xsdType, property.enum))
          } else if (property.oneOf && property.oneOf.length > 0) {
            container.append(
              buildEnumSimpleType(
                xsdType,
                property.oneOf.map((e) => e.const || '')
              )
            )
          } else if (property.pattern) {
            container.append(buildPatternSimpleType(xsdType, property.pattern))
          }
        }
      }
    }
  })

  content.push(`</xs:complexType></xs:sequence>`)
  container.append(content.join(''))
}

const buildPatternSimpleType = (name: string, pattern: string): string => {
  return `<xs:simpleType name="${name}"><xs:restriction base="xs:string"><xs:pattern value="${pattern}"/></xs:restriction></xs:simpleType>`
}

const buildEnumSimpleType = (name: string, enumeration: string[]): string => {
  const content: string[] = []
  content.push(`<xs:simpleType name="${name}"><xs:restriction base="xs:string">`)
  enumeration.forEach((e) => {
    content.push(`<xs:enumeration value="${e}"/>`)
  })
  content.push(`</xs:restriction></xs:simpleType>`)
  return content.join('')
}

/**
 * Loads JSON schema and returns generated XSD.
 *
 * @remarks
 *
 * Form is generated into Body element of XSD template:
 * ```xml
 * <xs:element name="E-form">
 *   <xs:complexType>
 *     <xs:sequence>
 *       <xs:element name="Meta" type="E-formMetaType"/>
 *       <xs:element name="Body" type="E-formBodyType"/>
 *     </xs:sequence>
 *   </xs:complexType>
 * </xs:element>
 * ```
 *
 * @param jsonSchema - JSON schema
 * @param xsdTemplate - XSD template including E-form metadata and some basic types (EnumerationType, PrilohaType)
 * @returns XSD schema
 */
export const loadAndBuildXsd = (
  jsonSchema: JsonSchema,
  xsdTemplate: string | undefined = defaultXsdTemplate
): string => {
  const $ = cheerio.load(xsdTemplate, { xmlMode: true, decodeEntities: false })

  const { properties, required } = mergeJsonSchema(jsonSchema)
  buildXsd($(`xs\\:schema`), 'E-formBodyType', required, properties, [])
  return $.html()
}

/**
 * Generate mock data from JSON schema.
 *
 *
 * @param jsonSchema - JSON schema
 * @returns mock data
 */
export const fakeData = (jsonSchema: JsonSchema) => {
  jsf.option({ useExamplesValue: true })
  jsf.format('data-url', () => jsf.random.randexp('^[\\w,\\s-]+\\.[A-Za-z]{3}$'))
  jsf.format('ciselnik', () => jsf.random.randexp('[a-zA-Z]+'))

  return jsf.generate(jsonSchema)
}
