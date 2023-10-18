import { formatUnicorn, loadAndBuildDefaultXslt, loadAndBuildXsd } from '@bratislava/json-schema-xsd-tools'
import chalk from 'chalk'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { cwd } from 'node:process'
import type { Arguments, CommandBuilder } from 'yargs'
import attachments from '../templates/attachments.xml'
import manifest from '../templates/manifest.xml'
import meta from '../templates/meta.xml'
import mimetype from '../templates/mimetype'
import posp from '../templates/posp.xml'
import { fileExists, folderExists } from '../utils/fsUtils'
import { BaseOptions, addDefaultOptions } from '../utils/yargsUtils'

type Options = BaseOptions & {
  gestor: string
}

export const command = 'pack'
export const desc = 'generate and pack form from JSON schema'

export const builder: CommandBuilder<Options, Options> = (yargs) => addDefaultOptions(yargs).options({gestor: {
  alias: 'g',
  describe: 'Gestor',
  type: 'string',
  default: 'Tisici Janko',
}})

const dateToIsoString = (date: Date): string => {
  return String(date.toISOString().split('T')[0])
}

const pack = async (jsonSchemaPath: string, identifier: string, version: string, gestor: string) => {
  if (!(await fileExists(jsonSchemaPath))) {
    console.log(chalk.red.bold('JSON schema not found'))
    return
  }

  const outPath = resolve(cwd(), identifier)
  if (!(await folderExists(outPath))) {
    await mkdir(outPath)
    await mkdir(resolve(outPath, 'Content'))
    await mkdir(resolve(outPath, 'Attachments'))
    await mkdir(resolve(outPath, 'META-INF'))
  }

  const jsonSchemaBuffer = await readFile(jsonSchemaPath)
  const schema = JSON.parse(jsonSchemaBuffer.toString())

  const xsd = loadAndBuildXsd(schema, identifier, version)
  const schemaPath = resolve(outPath, 'schema.xsd')
  await writeFile(schemaPath, xsd)

  const textXslt = loadAndBuildDefaultXslt(schema, 'text', identifier, version)
  const textXsltPath = resolve(outPath, 'Content', 'form.sb.xslt')
  await writeFile(textXsltPath, textXslt)

  const htmlXslt = loadAndBuildDefaultXslt(schema, 'html', identifier, version)
  const htmlXsltPath = resolve(outPath, 'Content', 'form.html.xslt')
  await writeFile(htmlXsltPath, htmlXslt)

  const pdfXslt = loadAndBuildDefaultXslt(schema, 'pdf', identifier, version)
  const pdfXsltPath = resolve(outPath, 'Content', 'form.fo.xslt')
  await writeFile(pdfXsltPath, pdfXslt)

  const mimetypePath = resolve(outPath, 'mimetype')
  await writeFile(mimetypePath, mimetype)

  const pospPath = resolve(outPath, 'Attachments', 'posp.xml')
  await writeFile(pospPath, posp)

  const attachmentsPath = resolve(outPath, 'attachments.xml')
  await writeFile(attachmentsPath, attachments)

  const dateFrom = new Date()

  const metaPath = resolve(outPath, 'meta.xml')
  await writeFile(
    metaPath,
    formatUnicorn(meta, {
      eformIdentifier: identifier,
      eformVersion: version,
      eformDateFrom: dateToIsoString(dateFrom),
      gestor: gestor
    })
  )

  const manifestPath = resolve(outPath, 'META-INF', 'manifest.xml')
  await writeFile(manifestPath, manifest)

  console.log(chalk.cyan.bold('done: '), outPath)
}

export const handler = (argv: Arguments<Options>) => {
  pack(resolve(cwd(), argv.json), argv.identifier, argv.ver, argv.gestor)
}
