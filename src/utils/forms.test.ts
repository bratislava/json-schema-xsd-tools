import { describe, test } from '@jest/globals'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { cwd } from 'node:process'
import { loadXsdAndBuildJsonSchema } from './forms'

describe('json schema xsd tools', () => {
  // test('validate schema', async () => {
  //   expect(true).toBe(true)
  // })

  test('build json schema', async () => {
    const xsdSchemaPath = resolve(cwd(), 'forms', '00603481.dopravneZnacenie.sk', 'schema.xsd')
    const jsonSchemaPath = resolve(cwd(), 'forms', '00603481.dopravneZnacenie.sk', 'schema.json')

    const xsdSchemaBuffer = await readFile(xsdSchemaPath)
    const jsonSchema = loadXsdAndBuildJsonSchema(xsdSchemaBuffer.toString())
    await writeFile(jsonSchemaPath, JSON.stringify(jsonSchema), 'utf8')
  })
})
