import { describe, test } from '@jest/globals'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { cwd } from 'node:process'
import { fakeData, loadAndBuildXsd } from '../../src/utils/forms'
import { loadAndValidate } from '../../src/utils/validation'

describe('generate', () => {
  test('generate xsd', async () => {
    const xsdPath = resolve(cwd(), 'forms', '00603481.dopravneZnacenie.sk', 'schema.generated.xsd')

    const jsonSchemaPath = resolve(cwd(), 'forms', '00603481.dopravneZnacenie.sk', 'schema.json')
    const jsonSchemaBuffer = await readFile(jsonSchemaPath)

    const xsd = loadAndBuildXsd(JSON.parse(jsonSchemaBuffer.toString()), '00603481.dopravneZnacenie.sk', '1.9')
    await writeFile(xsdPath, xsd)
  })

  test('generate xsd (allOf)', async () => {
    const xsdPath = resolve(cwd(), 'forms', 'allOf', 'schema.xsd')

    const jsonSchemaPath = resolve(cwd(), 'forms', 'allOf', 'schema.json')
    const jsonSchemaBuffer = await readFile(jsonSchemaPath)

    const xsd = loadAndBuildXsd(JSON.parse(jsonSchemaBuffer.toString()))
    await writeFile(xsdPath, xsd)
  })

  test('valid xsd (allOf)', async () => {
    const xsdSchemaPath = resolve(cwd(), 'forms', 'allOf', 'schema.xsd')
    const xsdSchemaBuffer = await readFile(xsdSchemaPath)

    const jsonSchemaPath = resolve(cwd(), 'forms', 'allOf', 'schema.json')
    const jsonSchemaBuffer = await readFile(jsonSchemaPath)

    const errors = loadAndValidate(xsdSchemaBuffer.toString(), JSON.parse(jsonSchemaBuffer.toString()))
    expect(errors).toHaveLength(0)
  })

  test('generate xsd (kontajnerove stojiska)', async () => {
    const xsdPath = resolve(cwd(), 'forms', 'kontajneroveStojiska', 'schema.xsd')

    const jsonSchemaPath = resolve(cwd(), 'forms', 'kontajneroveStojiska', 'schema.json')
    const jsonSchemaBuffer = await readFile(jsonSchemaPath)

    const xsd = loadAndBuildXsd(JSON.parse(jsonSchemaBuffer.toString()))
    await writeFile(xsdPath, xsd)
  })

  test('generate xsd (test)', async () => {
    const xsdPath = resolve(cwd(), 'forms', 'test', 'schema.xsd')

    const jsonSchemaPath = resolve(cwd(), 'forms', 'test', 'schema.json')
    const jsonSchemaBuffer = await readFile(jsonSchemaPath)

    const xsd = loadAndBuildXsd(JSON.parse(jsonSchemaBuffer.toString()))
    await writeFile(xsdPath, xsd)
  })

  test('valid xsd (kontajnerove stojiska)', async () => {
    const xsdSchemaPath = resolve(cwd(), 'forms', 'kontajneroveStojiska', 'schema.xsd')
    const xsdSchemaBuffer = await readFile(xsdSchemaPath)

    const jsonSchemaPath = resolve(cwd(), 'forms', 'kontajneroveStojiska', 'schema.json')
    const jsonSchemaBuffer = await readFile(jsonSchemaPath)

    const errors = loadAndValidate(xsdSchemaBuffer.toString(), JSON.parse(jsonSchemaBuffer.toString()))
    expect(errors).toHaveLength(0)
  })

  test('fake data', async () => {
    const dataPath = resolve(cwd(), 'forms', 'kontajneroveStojiska', 'data.json')
    const jsonSchemaPath = resolve(cwd(), 'forms', 'kontajneroveStojiska', 'schema.json')
    const jsonSchemaBuffer = await readFile(jsonSchemaPath)

    const data = await fakeData(JSON.parse(jsonSchemaBuffer.toString()))
    await writeFile(dataPath, JSON.stringify(data))
  })
})
