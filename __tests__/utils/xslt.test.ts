import { describe, test } from '@jest/globals'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { cwd } from 'node:process'
import type { JsonSchema } from '../../src'
import { loadAndBuildDefaultXslt } from '../../src/utils/xslt'

describe('generate stylesheets', () => {
  let jsonSchema: JsonSchema
  beforeAll(async () => {
    const jsonSchemaPath = resolve(cwd(), 'forms', 'kontajneroveStojiska', 'schema.json')
    const jsonSchemaBuffer = await readFile(jsonSchemaPath)
    jsonSchema = JSON.parse(jsonSchemaBuffer.toString());
  })

  test('generate text stylesheet', async () => {

    const xsltPath = resolve(cwd(), 'forms', 'kontajneroveStojiska', 'form.sb.xslt')
    const xslt = loadAndBuildDefaultXslt(jsonSchema, 'text');
    await writeFile(xsltPath, xslt);
  })

  test('generate html stylesheet', async () => {
    const xsltPath = resolve(cwd(), 'forms', 'kontajneroveStojiska', 'form.html.xslt')
    const xslt = loadAndBuildDefaultXslt(jsonSchema, 'html');
    await writeFile(xsltPath, xslt);
  })

    test('generate pdf stylesheet', async () => {
    const xsltPath = resolve(cwd(), 'forms', 'kontajneroveStojiska', 'form.fo.xslt')
    const xslt = loadAndBuildDefaultXslt(jsonSchema, 'pdf');
    await writeFile(xsltPath, xslt);
  })
})
