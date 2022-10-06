import * as cheerio from 'cheerio'
import { toLowerCamelCase } from './strings'

type JsonSchemaType = 'string' | 'number' | 'boolean' | 'object' | 'array' | 'null'

interface JsonSchema {
  type: JsonSchemaType
  title?: string
  description?: string
  properties?: JsonSchemaProperties
  required?: string[]
  pattern?: string
  enum?: string[]
}

interface Error {
  path: string[],
  message: string
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

const enumMap = new Map()
const buildJsonSchemaProperty = ($: cheerio.CheerioAPI, el: cheerio.AnyNode) : JsonSchema => {
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
        type: 'object',
        properties: schema.properties,
        required: schema.required
      }
    }
  }
}

const buildJsonSchema = ($: cheerio.CheerioAPI, path: string): JsonSchema => {
  const properties: JsonSchemaProperties = {}
  const required: string[] = []

  const extension = $(`${path} xs\\:extension`)
  if (extension.length) {
    const type = extension.attr('base')
    path = `xs\\:complexType[name='${type}']`
  }

  $(`${path} xs\\:element`).each(function () {    
    const property = buildJsonSchemaProperty($, this);
    const key = toLowerCamelCase(property.title);
    properties[key] = property;

    const minOccurs = $(this).attr('minOccurs')
    if(!minOccurs || minOccurs === '1') {
      required.push(key);
    }
  })

  return { properties, required, type: 'object' }
}

export const loadAndBuildJsonSchema = (xsdSchema: string) : JsonSchema => {
  const $ = cheerio.load(xsdSchema, { xmlMode: true })
  const jsonSchema = buildJsonSchema($, `xs\\:element[name='E-form'] xs\\:element[name='Body']`)
  return jsonSchema
}

const validate = (xsdSchema: JsonSchema, jsonSchema: JsonSchema, path: string[]) : Error[] => {
  let errors : Error[] = [];

  if(xsdSchema.properties) {
    Object.keys(xsdSchema.properties).forEach(key => {

      if(xsdSchema.properties) {
        if(!jsonSchema.properties) {
          errors.push({
            path,
            message: 'missing property'
          })
        }
        else {
          errors = [...errors, ...validate(xsdSchema.properties?.[key], jsonSchema.properties[key], [...path, key])]
        }
      }
    });
  }

  return errors;
}

export const loadAndValidate = (xsd: string, jsonSchema: JsonSchema): Error[] => {
  const $ = cheerio.load(xsd, { xmlMode: true })
  const xsdSchema = buildJsonSchema($, `xs\\:element[name='E-form'] xs\\:element[name='Body']`)

  const errors = validate(xsdSchema, jsonSchema, [])
  return errors
}
