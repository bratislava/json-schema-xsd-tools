import { describe, test } from '@jest/globals'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { cwd } from 'node:process'
import { loadAndBuildXslt } from '../../src/utils/xslt'

describe('generate stylesheets', () => {
  let jsonSchemaBuffer: Buffer
  beforeAll(async () => {
    const jsonSchemaPath = resolve(cwd(), 'forms', 'kontajner', 'schema.json')
    jsonSchemaBuffer = await readFile(jsonSchemaPath)
  })

  test('generate text stylesheet', async () => {
    const templatePath = resolve(cwd(), 'forms', 'kontajner', 'template.sb.xslt')
    const templateBuffer = await readFile(templatePath)

    const xsltPath = resolve(cwd(), 'forms', 'kontajner', 'form.sb.xslt')

    const xslt = loadAndBuildXslt(JSON.parse(jsonSchemaBuffer.toString()), templateBuffer.toString());

    await writeFile(xsltPath, xslt);
  })
})
