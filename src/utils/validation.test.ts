import { describe, test } from '@jest/globals'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { cwd } from 'node:process'
import { ErrorType, loadAndValidate } from './validation'

describe('validation', () => {
  let xsdSchemaBuffer: Buffer
  beforeAll(async () => {
    const xsdSchemaPath = resolve(cwd(), 'forms', '00603481.dopravneZnacenie.sk', 'schema.xsd')
    xsdSchemaBuffer = await readFile(xsdSchemaPath)
  })

  test('valid schema', async () => {
    const jsonSchemaPath = resolve(cwd(), 'forms', '00603481.dopravneZnacenie.sk', 'schema.json')
    const jsonSchemaBuffer = await readFile(jsonSchemaPath)

    const errors = loadAndValidate(xsdSchemaBuffer.toString(), JSON.parse(jsonSchemaBuffer.toString()))
    expect(errors).toHaveLength(0)
  })

  test('invalid enum values', async () => {
    const jsonSchemaPath = resolve(cwd(), 'forms', '00603481.dopravneZnacenie.sk', 'schema.invalid.json')
    const jsonSchemaBuffer = await readFile(jsonSchemaPath)

    const errors = loadAndValidate(xsdSchemaBuffer.toString(), JSON.parse(jsonSchemaBuffer.toString()))

    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: ErrorType.Enum,
        }),
      ])
    )
  })

  test('ignore enum values', async () => {
    const jsonSchemaPath = resolve(cwd(), 'forms', '00603481.dopravneZnacenie.sk', 'schema.invalid.json')
    const jsonSchemaBuffer = await readFile(jsonSchemaPath)

    const options = {
      ignore: ['enum'],
    }
    const errors = loadAndValidate(xsdSchemaBuffer.toString(), JSON.parse(jsonSchemaBuffer.toString()), options)
    expect(errors).toHaveLength(0)
  })

  test('valid strict schema', async () => {
    const jsonSchemaPath = resolve(cwd(), 'forms', '00603481.dopravneZnacenie.sk', 'schema.valid.json')
    const jsonSchemaBuffer = await readFile(jsonSchemaPath)

    const errors = loadAndValidate(xsdSchemaBuffer.toString(), JSON.parse(jsonSchemaBuffer.toString()))
    expect(errors).toHaveLength(0)
  })
})
