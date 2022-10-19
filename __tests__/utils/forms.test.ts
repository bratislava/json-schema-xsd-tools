import { describe, test } from '@jest/globals'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { cwd } from 'node:process'
import { loadAndBuildXsd } from '../../src/utils/forms'
import { loadAndValidate } from '../../src/utils/validation'

describe('generate xsd', () => {
  test('generate xsd', async () => {
    const templatePath = resolve(cwd(), 'forms', '00603481.dopravneZnacenie.sk', 'template.xsd')
    const xsdPath = resolve(cwd(), 'forms', '00603481.dopravneZnacenie.sk', 'schema.generated.xsd')

    const templateBuffer = await readFile(templatePath)
    const jsonSchemaPath = resolve(cwd(), 'forms', '00603481.dopravneZnacenie.sk', 'schema.json')
    const jsonSchemaBuffer = await readFile(jsonSchemaPath)

    const xsd = loadAndBuildXsd(JSON.parse(jsonSchemaBuffer.toString()), templateBuffer.toString())
    await writeFile(xsdPath, xsd)
  })

  test('generate xsd (allOf)', async () => {
    const templatePath = resolve(cwd(), 'forms', 'test', 'template.xsd')
    const xsdPath = resolve(cwd(), 'forms', 'test', 'schema.xsd')

    const templateBuffer = await readFile(templatePath)
    const jsonSchemaPath = resolve(cwd(), 'forms', 'test', 'schema.json')
    const jsonSchemaBuffer = await readFile(jsonSchemaPath)

    const xsd = loadAndBuildXsd(JSON.parse(jsonSchemaBuffer.toString()), templateBuffer.toString())
    await writeFile(xsdPath, xsd)
  })

  test('valid xsd (allOf)', async () => {
    const xsdSchemaPath = resolve(cwd(), 'forms', 'test', 'schema.xsd')
    const xsdSchemaBuffer = await readFile(xsdSchemaPath)

    const jsonSchemaPath = resolve(cwd(), 'forms', 'test', 'schema.json')
    const jsonSchemaBuffer = await readFile(jsonSchemaPath)

    const errors = loadAndValidate(xsdSchemaBuffer.toString(), JSON.parse(jsonSchemaBuffer.toString()))
    expect(errors).toHaveLength(0)
  })

  test('generate xsd (if then)', async () => {
    const templatePath = resolve(cwd(), 'forms', 'kontajner', 'template.xsd')
    const xsdPath = resolve(cwd(), 'forms', 'kontajner', 'schema.xsd')

    const templateBuffer = await readFile(templatePath)
    const jsonSchemaPath = resolve(cwd(), 'forms', 'kontajner', 'schema.json')
    const jsonSchemaBuffer = await readFile(jsonSchemaPath)

    const xsd = loadAndBuildXsd(JSON.parse(jsonSchemaBuffer.toString()), templateBuffer.toString())
    await writeFile(xsdPath, xsd)
  })

  test('valid xsd (if then)', async () => {
    const xsdSchemaPath = resolve(cwd(), 'forms', 'kontajner', 'schema.xsd')
    const xsdSchemaBuffer = await readFile(xsdSchemaPath)

    const jsonSchemaPath = resolve(cwd(), 'forms', 'kontajner', 'schema.json')
    const jsonSchemaBuffer = await readFile(jsonSchemaPath)

    const errors = loadAndValidate(xsdSchemaBuffer.toString(), JSON.parse(jsonSchemaBuffer.toString()))
    expect(errors).toHaveLength(0)
  })

  test('generate xsd (if then, allOf)', async () => {
    const templatePath = resolve(cwd(), 'forms', 'kontajner-allOf', 'template.xsd')
    const xsdPath = resolve(cwd(), 'forms', 'kontajner-allOf', 'schema.xsd')

    const templateBuffer = await readFile(templatePath)
    const jsonSchemaPath = resolve(cwd(), 'forms', 'kontajner-allOf', 'schema.json')
    const jsonSchemaBuffer = await readFile(jsonSchemaPath)

    const xsd = loadAndBuildXsd(JSON.parse(jsonSchemaBuffer.toString()), templateBuffer.toString())
    await writeFile(xsdPath, xsd)
  })

  test('valid xsd (if then, allOf)', async () => {
    const xsdSchemaPath = resolve(cwd(), 'forms', 'kontajner-allOf', 'schema.xsd')
    const xsdSchemaBuffer = await readFile(xsdSchemaPath)

    const jsonSchemaPath = resolve(cwd(), 'forms', 'kontajner-allOf', 'schema.json')
    const jsonSchemaBuffer = await readFile(jsonSchemaPath)

    const errors = loadAndValidate(xsdSchemaBuffer.toString(), JSON.parse(jsonSchemaBuffer.toString()))
    expect(errors).toHaveLength(0)
  })
})
