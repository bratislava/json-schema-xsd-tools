import { fakeData, formatUnicorn, loadAndBuildDefaultXslt, loadAndBuildXsd } from '@bratislava/json-schema-xsd-tools'
import chalk from 'chalk'
import { exec } from 'child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { cwd } from 'node:process'
import type { Arguments, CommandBuilder } from 'yargs'
import formIndex from '../templates/formIndex'
import xmlTemplate from '../templates/template.xml'
import uiSchema from '../templates/uiSchema.json'
import { fileExists, folderExists } from '../utils/fsUtils'
import { BaseOptions, addDefaultOptions } from '../utils/yargsUtils'

type Options = BaseOptions

export const command = 'generate'
export const desc = 'generate form from JSON schema'

export const builder: CommandBuilder<Options, Options> = (yargs) => addDefaultOptions(yargs)

const setExt = (path: string, ext: string) => {
  return `${path.substr(0, path.lastIndexOf('.'))}.${ext}`
}

const execXslt3 = (path: string) => {
  return new Promise((resolve, reject) => {
    exec(
      `npx xslt3 -xsl:${path} -export:${setExt(path, 'sef.json')} -t`,
      (error: any, stdout: string, stderr: string) => {
        if (error) {
          reject(error.message)
          return
        }

        if (stderr) {
          reject(error?.message)
          return
        }

        resolve(stdout)
      }
    )
  })
}

const generate = async (jsonSchemaPath: string, identifier: string, version: string) => {
  if (!(await fileExists(jsonSchemaPath))) {
    console.log(chalk.red.bold('JSON schema not found'))
    return
  }

  const outPath = resolve(cwd(), identifier)
  if (!(await folderExists(outPath))) {
    await mkdir(outPath)
  }

  const jsonSchemaBuffer = await readFile(jsonSchemaPath)
  const schema = JSON.parse(jsonSchemaBuffer.toString())

  const xsd = loadAndBuildXsd(schema, identifier, version)
  const xsdPath = resolve(outPath, 'schema.xsd.ts')
  await writeFile(xsdPath, `export default \`${xsd}\``)

  const textXslt = loadAndBuildDefaultXslt(schema, 'text', identifier, version)
  const textXsltPath = resolve(outPath, 'form.sb.xslt')
  await writeFile(textXsltPath, textXslt)

  const htmlXslt = loadAndBuildDefaultXslt(schema, 'html', identifier, version)
  const htmlXsltPath = resolve(outPath, 'form.html.xslt')
  await writeFile(htmlXsltPath, htmlXslt)

  const pdfXslt = loadAndBuildDefaultXslt(schema, 'pdf', identifier, version)
  const pdfXsltPath = resolve(outPath, 'form.fo.xslt')
  await writeFile(pdfXsltPath, pdfXslt)

  const data = fakeData(schema)
  const dataPath = resolve(outPath, 'data.json')
  await writeFile(dataPath, JSON.stringify(data))

  const uiSchemaPath = resolve(outPath, 'uiSchema.json')
  await writeFile(uiSchemaPath, JSON.stringify(uiSchema))

  const schemaPath = resolve(outPath, 'schema.json')
  await writeFile(schemaPath, JSON.stringify(schema))

  const xmlTemplatePath = resolve(outPath, 'xmlTemplate.ts')
  await writeFile(
    xmlTemplatePath,
    `export default \`${formatUnicorn(xmlTemplate, { eformIdentifier: identifier, eformVersion: version })}\``
  )

  try {
    const res = await execXslt3(textXsltPath)
    console.log(res)
  } catch (error) {
    console.error(error)
  }

  try {
    const res = await execXslt3(htmlXsltPath)
    console.log(res)
  } catch (error) {
    console.error(error)
  }

  await writeFile(outPath + '.ts', formatUnicorn(formIndex, { eformIdentifier: identifier }))
  console.log(chalk.cyan.bold('done: '), outPath)
}

export const handler = (argv: Arguments<Options>) => {
  generate(resolve(cwd(), argv.json), argv.identifier, argv.ver)
}
