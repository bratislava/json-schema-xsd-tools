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
const buildJsonSchema = ($: cheerio.CheerioAPI, path: string): JsonSchema => {
  const properties: JsonSchemaProperties = {}
  const required: string[] = []

  const extension = $(`${path} xs\\:extension`)
  if (extension.length) {
    const type = extension.attr('base')
    path = `xs\\:complexType[name='${type}']`
  }

  $(`${path} xs\\:element`).each(function () {
    const title = $(this).attr('name')
    const key = toLowerCamelCase(title)
    const type = $(this).attr('type')
    
    const minOccurs = $(this).attr('minOccurs');
    if(!minOccurs || minOccurs === '1') {
      required.push(key);
    }

    if (!type) {
      const restriction = $(this).find(`xs\\:restriction`)
      properties[key] = {
        title,
        type: getJsonSchemaType(restriction.attr('base')),
        pattern: $(restriction).children(`xs\\:pattern`).attr('value'),
      }
    } else if (type.startsWith('xs:')) {
      properties[key] = {
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

        properties[key] = {
          title,
          type: getJsonSchemaType(restriction.attr('base')),
          pattern: $(restriction).children(`xs\\:pattern`).attr('value'),
          enum: enumeration,
        }
      } else {
        const schema = buildJsonSchema($, `xs\\:complexType[name='${type}']`)
        properties[key] = {
          title,
          type: 'object',
          properties: schema.properties,
          required: schema.required
        }
      }
    }
  })

  return { properties, required, type: 'object' }
}

export const loadXsdAndBuildJsonSchema = (xsd: string) : JsonSchema => {
  const $ = cheerio.load(xsd, { xmlMode: true })
  const jsonSchema = buildJsonSchema($, `xs\\:element[name='E-form'] xs\\:element[name='Body']`)
  return jsonSchema
}

export const validate = () : boolean => {
  return true
}
