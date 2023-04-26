#!/usr/bin/env node

const yargs = require('yargs')
const chalk = require('chalk')
const { readFile, writeFile, access, stat, mkdir } = require('node:fs/promises')
const { cwd } = require('node:process')
const { resolve } = require('node:path')
const { exec } = require('child_process')
const {
  loadAndBuildXsd,
  loadAndValidate,
  loadAndBuildDefaultXslt,
  fakeData,
  formatUnicorn,
} = require('../dist/json-schema-xsd-tools')
const uiSchema = require('./templates/uiSchema.json')
const xmlTemplate = require('./templates/template.xml')
const formIndex = require('./templates/formIndex')
const mimetype = require('./templates/mimetype')
const meta = require('./templates/meta.xml')
const posp = require('./templates/posp.xml')
const attachments = require('./templates/attachments.xml')
const manifest = require('./templates/manifest.xml')

async function fileExists(path) {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

async function folderExists(path) {
  try {
    const stats = await stat(path)
    return stats.isDirectory()
  } catch {
    return false
  }
}

const pack = async (jsonSchemaPath, identifier, version) => {
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
  const xsdPath = resolve(outPath, 'Content', 'form.xsd')
  await writeFile(xsdPath, xsd)

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

  const metaPath = resolve(outPath, 'meta.xml')
  await writeFile(metaPath, formatUnicorn(meta, { eformIdentifier: identifier, eformVersion: version }))

  const manifestPath = resolve(outPath, 'META-INF', 'manifest.xml')
  await writeFile(manifestPath, manifest)

  const data = fakeData(schema)
  const dataPath = resolve(outPath, 'data.json')
  await writeFile(dataPath, JSON.stringify(data))

  console.log(chalk.cyan.bold('done: '), outPath)
}

const generateXsd = async (jsonSchemaPath, identifier, version, templatePath, xsdPath) => {
  if (!(await fileExists(jsonSchemaPath))) {
    console.log(chalk.red.bold('JSON schema not found'))
    return
  }

  let template
  if (await fileExists(templatePath)) {
    const templateBuffer = await readFile(templatePath)
    template = templateBuffer.toString()
  }

  const jsonSchemaBuffer = await readFile(jsonSchemaPath)
  const xsd = loadAndBuildXsd(JSON.parse(jsonSchemaBuffer.toString()), identifier, version, template)
  await writeFile(xsdPath, xsd)

  console.log(chalk.cyan.bold('generated: '), xsdPath)
}

const generateXslt = async (jsonSchemaPath, xsltPath, transformationType, identifier, version) => {
  if (!(await fileExists(jsonSchemaPath))) {
    console.log(chalk.red.bold('JSON schema not found'))
    return
  }

  const jsonSchemaBuffer = await readFile(jsonSchemaPath)
  const xslt = loadAndBuildDefaultXslt(JSON.parse(jsonSchemaBuffer.toString()), transformationType, identifier, version)
  await writeFile(xsltPath, xslt)
  console.log(chalk.cyan.bold('generated: '), xsltPath)
}

const generateFakeData = async (jsonSchemaPath, dataPath) => {
  if (!(await fileExists(jsonSchemaPath))) {
    console.log(chalk.red.bold('JSON schema not found'))
    return
  }

  const jsonSchemaBuffer = await readFile(jsonSchemaPath)
  const data = fakeData(JSON.parse(jsonSchemaBuffer.toString()))
  await writeFile(dataPath, JSON.stringify(data))
  console.log(chalk.cyan.bold('generated: '), dataPath)
}

const setExt = (path, ext) => {
  return `${path.substr(0, path.lastIndexOf('.'))}.${ext}`
}

const execXslt3 = (path) => {
  return new Promise((resolve, reject) => {
    exec(`npx xslt3 -xsl:${path} -export:${setExt(path, 'sef.json')} -t`, (error, stdout, stderr) => {
      if (error) {
        reject(error.message)
        return
      }

      if (stderr) {
        reject(error.message)
        return
      }

      resolve(stdout)
    })
  })
}

const generate = async (jsonSchemaPath, identifier, version) => {
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

const validate = async (jsonSchemaPath, xsdPath) => {
  if (!(await fileExists(jsonSchemaPath))) {
    console.log(chalk.red.bold('JSON schema not found'))
    return
  }
  if (!(await fileExists(xsdPath))) {
    console.log(chalk.red.bold('XSD not found'))
    return
  }

  const jsonSchemaBuffer = await readFile(jsonSchemaPath)
  const xsdSchemaBuffer = await readFile(xsdPath)

  const errors = await loadAndValidate(xsdSchemaBuffer.toString(), JSON.parse(jsonSchemaBuffer.toString()))
  if (errors.length === 0) {
    console.log(chalk.cyan.bold('valid'))
  } else {
    console.log(chalk.red.bold('errors:'))
    errors.forEach((error) => {
      console.log(`${chalk.red.bold(error.type)} at ${error.path.join('.')}`)
    })
  }
}

const identifier = {
  alias: 'i',
  describe: 'Form identifier',
  type: 'string',
  default: 'form',
}

const ver = {
  alias: 'v',
  describe: 'Form version',
  type: 'string',
  default: '0.1',
}

yargs
  .usage('Usage: json-schema-xsd-tools <command> -t <template> -x <xsd> -j <json>')
  .command({
    command: 'generate-xsd',
    describe: 'generate XSD from JSON schema',
    builder: {
      json: {
        alias: 'j',
        describe: 'JSON schema path',
        demandOption: true,
        type: 'string',
      },
      identifier,
      ver,
      template: {
        alias: 't',
        describe: 'Template path',
        type: 'string',
        default: 'template.xsd',
      },
      out: {
        alias: 'o',
        describe: 'XSD output path',
        type: 'string',
        default: 'schema.xsd',
      },
    },

    handler(argv) {
      generateXsd(
        resolve(cwd(), argv.json),
        argv.identifier,
        argv.ver,
        resolve(cwd(), argv.template),
        resolve(cwd(), argv.out)
      )
    },
  })
  .command({
    command: 'generate-text-xslt',
    describe: 'generate text stylesheet from JSON schema',
    builder: {
      json: {
        alias: 'j',
        describe: 'JSON schema path',
        demandOption: true,
        type: 'string',
      },
      identifier,
      ver,
      out: {
        alias: 'o',
        describe: 'xslt output path',
        type: 'string',
        default: 'form.sb.xslt',
      },
    },

    handler(argv) {
      generateXslt(resolve(cwd(), argv.json), resolve(cwd(), argv.out), 'text', argv.identifier, argv.ver)
    },
  })
  .command({
    command: 'generate-html-xslt',
    describe: 'generate html stylesheet from JSON schema',
    builder: {
      json: {
        alias: 'j',
        describe: 'JSON schema path',
        demandOption: true,
        type: 'string',
      },
      identifier,
      ver,
      out: {
        alias: 'o',
        describe: 'xslt output path',
        type: 'string',
        default: 'form.html.xslt',
      },
    },

    handler(argv) {
      generateXslt(resolve(cwd(), argv.json), resolve(cwd(), argv.out), 'html', argv.identifier, argv.ver)
    },
  })
  .command({
    command: 'generate-pdf-xslt',
    describe: 'generate pdf stylesheet from JSON schema',
    builder: {
      json: {
        alias: 'j',
        describe: 'JSON schema path',
        demandOption: true,
        type: 'string',
      },
      identifier,
      ver,
      out: {
        alias: 'o',
        describe: 'xslt output path',
        type: 'string',
        default: 'form.fo.xslt',
      },
    },

    handler(argv) {
      generateXslt(resolve(cwd(), argv.json), resolve(cwd(), argv.out), 'pdf', argv.identifier, argv.ver)
    },
  })
  .command({
    command: 'generate',
    describe: 'generate form from JSON schema',
    builder: {
      json: {
        alias: 'j',
        describe: 'JSON schema path',
        demandOption: true,
        type: 'string',
      },
      identifier,
      ver,
    },

    handler(argv) {
      generate(resolve(cwd(), argv.json), argv.identifier, argv.ver)
    },
  })
  .command({
    command: 'pack',
    describe: 'generate and pack form from JSON schema',
    builder: {
      json: {
        alias: 'j',
        describe: 'JSON schema path',
        demandOption: true,
        type: 'string',
      },
      identifier,
      ver,
    },

    handler(argv) {
      pack(resolve(cwd(), argv.json), argv.identifier, argv.ver)
    },
  })
  .command({
    command: 'fake-data',
    describe: 'generate mock data from JSON schema',
    builder: {
      json: {
        alias: 'j',
        describe: 'JSON schema path',
        demandOption: true,
        type: 'string',
      },
      out: {
        alias: 'o',
        describe: 'data output path',
        type: 'string',
        default: 'form.json',
      },
    },

    handler(argv) {
      generateFakeData(resolve(cwd(), argv.json), resolve(cwd(), argv.out))
    },
  })
  .command({
    command: 'validate',
    describe: 'validate XSD against JSON schema',
    builder: {
      json: {
        alias: 'j',
        describe: 'JSON schema path',
        demandOption: true,
        type: 'string',
      },
      xsd: {
        alias: 'x',
        describe: 'XSD path',
        type: 'string',
        demandOption: true,
      },
    },

    handler(argv) {
      validate(resolve(cwd(), argv.json), resolve(cwd(), argv.xsd))
    },
  })
  .demandCommand().argv
