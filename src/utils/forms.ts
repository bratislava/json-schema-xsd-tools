import * as cheerio from 'cheerio'
import { toLowerCamelCase } from './strings'

type JsonSchemaType = 'string' | 'number' | 'boolean' | 'object' | 'array' | 'null'
type JsonSchemaFormat = 'date' | 'date-time' | 'data-url' | undefined

export interface JsonSchema {
  type: JsonSchemaType
  format?: JsonSchemaFormat
  title?: string
  description?: string
  properties?: JsonSchemaProperties
  items?: JsonSchemaItems
  required?: string[]
  pattern?: string
  enum?: string[]
}

interface JsonSchemaItems {
  type: JsonSchemaType
  format?: string
}

interface JsonSchemaProperties {
  [key: string]: JsonSchema
}

const getJsonSchemaType = (type: string | undefined): JsonSchemaType => {
  switch (type) {
    case 'xs:boolean':
      return 'boolean'
    case 'xs:string':
    case 'xs:date':
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
    default:
      return undefined
  }
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
  } else if (type.startsWith('xs:')) {
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
        enum: enumeration,
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
      const key = toLowerCamelCase(property.title)

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
    format: isAttachment ? 'data-url' : undefined,
  }
}

export const loadAndBuildJsonSchema = (xsdSchema: string): JsonSchema => {
  const $ = cheerio.load(xsdSchema, { xmlMode: true })
  const jsonSchema = buildJsonSchema($, `xs\\:element[name='E-form'] xs\\:element[name='Body']`)
  return jsonSchema
}
