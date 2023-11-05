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
import xmlTemplate from '../templates/template.xml'
import { fileExists, folderExists } from '../utils/fsUtils'
import { BaseOptions, addDefaultOptions } from '../utils/yargsUtils'
import { emptyXml, fakeData, loadAndBuildXsd } from '../core/forms'
import { formatUnicorn } from '../core/strings'
import { loadAndBuildDefaultXslt } from '../core/xslt'
import archiver from 'archiver'
import fs from 'node:fs'

type Options = BaseOptions & {
  gestor: string
  delay: boolean
}

export const command = 'pack'
export const desc = 'generate and pack form from JSON schema'

export const builder: CommandBuilder<Options, Options> = (yargs) =>
  addDefaultOptions(yargs).options({
    gestor: {
      alias: 'g',
      describe: 'Gestor',
      type: 'string',
      default: 'Tisici Janko',
    },
    delay: {
      describe: 'Set the published/in force date to 5 days from now (required for production NASES submit)',
      type: 'boolean',
      default: false,
    },
  })

const dateToIsoString = (date: Date): string => {
  return String(date.toISOString().split('T')[0])
}

const pack = async (jsonSchemaPath: string, gestor: string, delay: boolean) => {
  if (!(await fileExists(jsonSchemaPath))) {
    console.log(chalk.red.bold('JSON schema not found'))
    return
  }

  const jsonSchemaBuffer = await readFile(jsonSchemaPath)
  const schema = JSON.parse(jsonSchemaBuffer.toString())

  const identifier = schema.pospID
  const version = schema.pospVersion
  const title = schema.title

  // we put everything needed for the NASES zip one level deeper, the zip itself and other files needed by our BE next to it
  const outPath = resolve(cwd(), 'generated', identifier)
  const rootPath = resolve(cwd(), 'generated')
  if (!(await folderExists(rootPath))) {
    await mkdir(rootPath)
  }
  if (!(await folderExists(outPath))) {
    await mkdir(outPath)
  }
  if (!(await folderExists(resolve(outPath, 'Content')))) {
    await mkdir(resolve(outPath, 'Content'))
  }
  if (!(await folderExists(resolve(outPath, 'Attachments')))) {
    await mkdir(resolve(outPath, 'Attachments'))
  }
  if (!(await folderExists(resolve(outPath, 'META-INF')))) {
    await mkdir(resolve(outPath, 'META-INF'))
  }

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
  // needed both in the zip and in the BE, we write it two times
  const pdfXsltPath = resolve(outPath, 'Content', 'form.fo.xslt')
  const beCopyPdfXsltPath = resolve(rootPath, 'form.fo.xslt')
  await writeFile(pdfXsltPath, pdfXslt)
  await writeFile(beCopyPdfXsltPath, pdfXslt)

  const mimetypePath = resolve(outPath, 'mimetype')
  await writeFile(mimetypePath, mimetype)

  const pospPath = resolve(outPath, 'Attachments', 'posp.xml')
  await writeFile(pospPath, posp)

  const attachmentsPath = resolve(outPath, 'attachments.xml')
  await writeFile(attachmentsPath, attachments)

  const dateFrom = new Date()
  if (delay) {
    dateFrom.setDate(dateFrom.getDate() + 5)
  }

  const metaPath = resolve(outPath, 'meta.xml')
  await writeFile(
    metaPath,
    formatUnicorn(meta, {
      eformTitle: title,
      eformIdentifier: identifier,
      eformVersion: version,
      eformDateFrom: dateToIsoString(dateFrom),
      gestor: gestor,
    })
  )

  const manifestPath = resolve(outPath, 'META-INF', 'manifest.xml')
  await writeFile(manifestPath, manifest)

  // TODO when we start dealing with ZEP add zepRequired as input param
  const dataXml = formatUnicorn(xmlTemplate, {
    eformTitle: title,
    eformIdentifier: identifier,
    eformVersion: version,
    gestor,
    zepRequired: '0',
    body: await emptyXml(schema),
  })
  // needed both in the zip and in the BE, we write it two times
  const dataPath = resolve(outPath, 'data.xml')
  const beCopyDataPath = resolve(rootPath, 'data.xml')
  await writeFile(dataPath, dataXml)
  await writeFile(beCopyDataPath, dataXml)

  const zipPath = resolve(rootPath, identifier + '.zip')
  const output = fs.createWriteStream(zipPath)
  const archive = archiver('zip')
  archive.pipe(output)
  archive.directory(outPath, false)
  await archive.finalize()

  // the following files are not needed in the zip, but are needed by the BE

  const dataObj = await fakeData(schema)
  const dataJsonPath = resolve(rootPath, 'data.json')
  await writeFile(dataJsonPath, JSON.stringify(dataObj))

  const emptyXmlTemplateWithPrefilledHeader = formatUnicorn(xmlTemplate, {
    eformTitle: title,
    eformIdentifier: identifier,
    eformVersion: version,
    gestor,
    zepRequired: '0',
    body: '',
  })
  const emptyXmlTemplateWithPrefilledHeaderPath = resolve(rootPath, 'xmlTemplate.xml')
  await writeFile(emptyXmlTemplateWithPrefilledHeaderPath, emptyXmlTemplateWithPrefilledHeader)

  console.log(chalk.cyan.bold('done: '), outPath)
}

export const handler = (argv: Arguments<Options>) => {
  pack(resolve(cwd(), argv.json), argv.gestor, argv.delay)
}
