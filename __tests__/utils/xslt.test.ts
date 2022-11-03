import { describe, test } from '@jest/globals'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { cwd } from 'node:process'
import type { JsonSchema } from '../../src'
import { loadAndBuildHtmlXslt, loadAndBuildPdfXslt, loadAndBuildTextXslt } from '../../src/utils/xslt'

describe('generate stylesheets', () => {
  let jsonSchema: JsonSchema
  beforeAll(async () => {
    const jsonSchemaPath = resolve(cwd(), 'forms', 'kontajneroveStojiska', 'schema.json')
    const jsonSchemaBuffer = await readFile(jsonSchemaPath)
    jsonSchema = JSON.parse(jsonSchemaBuffer.toString());
  })

  test('generate text stylesheet', async () => {

    const xsltPath = resolve(cwd(), 'forms', 'kontajneroveStojiska', 'form.sb.xslt')
    const xslt = loadAndBuildTextXslt(jsonSchema);
    await writeFile(xsltPath, xslt);
  })

  test('generate html stylesheet', async () => {
    const xsltPath = resolve(cwd(), 'forms', 'kontajneroveStojiska', 'form.html.xslt')
    const xslt = loadAndBuildHtmlXslt(jsonSchema);
    await writeFile(xsltPath, xslt);
  })

    test('generate pdf stylesheet', async () => {
    const xsltPath = resolve(cwd(), 'forms', 'kontajneroveStojiska', 'form.fo.xslt')
    const xslt = loadAndBuildPdfXslt(jsonSchema);
    await writeFile(xsltPath, xslt);
  })
})
