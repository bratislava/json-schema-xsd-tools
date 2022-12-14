#!/usr/bin/env node

const yargs = require('yargs')
const chalk = require('chalk')
const { readFile, writeFile, access, stat, mkdir } = require('node:fs/promises')
const { cwd } = require('node:process')
const { resolve } = require('node:path')
const { exec } = require('child_process')
const { loadAndBuildXsd, loadAndValidate, loadAndBuildDefaultXslt, fakeData } = require('../dist/json-schema-xsd-tools')
const uiSchema = require('./uiSchema.json')

const buildXmlTemplate = (form) => `<?xml version="1.0" encoding="utf-8"?>
<E-form xmlns="http://schemas.gov.sk/doc/eform/form/0.1"
        xsi:schemaLocation="http://schemas.gov.sk/doc/eform/form/0.1"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <Meta>
    <ID>${form}</ID>
    <Name>${form}</Name>
    <Gestor></Gestor>
    <RecipientId></RecipientId>
    <Version>0.1</Version>
    <ZepRequired>false</ZepRequired>
    <EformUuid>5ea0cad2-8759-4826-8d4c-c59c1d09ec29</EformUuid>
    <SenderID>mailto:hruska@example.com</SenderID>
  </Meta>
</E-form>`

const buildFormIndex = (form) => `import htmlStylesheet from './${form}/form.html.sef.json'
import textStylesheet from './${form}/form.sb.sef.json'
import schema from './${form}/schema.json'
import xsd from './${form}/schema.xsd'
import uiSchema from './${form}/uiSchema.json'
import data from './${form}/data.json'
import xmlTemplate from './${form}/xmlTemplate'

export default {
  schema,
  uiSchema,
  xsd,
  xmlTemplate,
  textStylesheet,
  htmlStylesheet,
  data
}`

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

const generateXsd = async (jsonSchemaPath, templatePath, xsdPath) => {
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
  const xsd = loadAndBuildXsd(JSON.parse(jsonSchemaBuffer.toString()), template)
  await writeFile(xsdPath, xsd)

  console.log(chalk.cyan.bold('generated: '), xsdPath)
}

const generateXslt = async (jsonSchemaPath, xsltPath, transformationType) => {
  if (!(await fileExists(jsonSchemaPath))) {
    console.log(chalk.red.bold('JSON schema not found'))
    return
  }

  const jsonSchemaBuffer = await readFile(jsonSchemaPath)
  const xslt = loadAndBuildDefaultXslt(JSON.parse(jsonSchemaBuffer.toString()), transformationType)
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

const generate = async (jsonSchemaPath, out) => {
  if (!(await fileExists(jsonSchemaPath))) {
    console.log(chalk.red.bold('JSON schema not found'))
    return
  }

  const outPath = resolve(cwd(), out)
  if (!(await folderExists(outPath))) {
    await mkdir(outPath)
  }

  const jsonSchemaBuffer = await readFile(jsonSchemaPath)
  const schema = JSON.parse(jsonSchemaBuffer.toString())

  const xsd = loadAndBuildXsd(schema)
  const xsdPath = resolve(outPath, 'schema.xsd.ts')
  await writeFile(xsdPath, `export default \`${xsd}\``)

  const textXslt = loadAndBuildDefaultXslt(schema, 'text')
  const textXsltPath = resolve(outPath, 'form.sb.xslt')
  await writeFile(textXsltPath, textXslt)

  const htmlXslt = loadAndBuildDefaultXslt(schema, 'html')
  const htmlXsltPath = resolve(outPath, 'form.html.xslt')
  await writeFile(htmlXsltPath, htmlXslt)

  const pdfXslt = loadAndBuildDefaultXslt(schema, 'pdf')
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
  await writeFile(xmlTemplatePath, `export default \`${buildXmlTemplate(out)}\``)

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

  await writeFile(outPath + '.ts', buildFormIndex(out))
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
      generateXsd(resolve(cwd(), argv.json), resolve(cwd(), argv.template), resolve(cwd(), argv.out))
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
      out: {
        alias: 'o',
        describe: 'xslt output path',
        type: 'string',
        default: 'form.sb.xslt',
      },
    },

    handler(argv) {
      generateXslt(resolve(cwd(), argv.json), resolve(cwd(), argv.out), 'text')
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
      out: {
        alias: 'o',
        describe: 'xslt output path',
        type: 'string',
        default: 'form.html.xslt',
      },
    },

    handler(argv) {
      generateXslt(resolve(cwd(), argv.json), resolve(cwd(), argv.out), 'html')
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
      out: {
        alias: 'o',
        describe: 'xslt output path',
        type: 'string',
        default: 'form.fo.xslt',
      },
    },

    handler(argv) {
      generateXslt(resolve(cwd(), argv.json), resolve(cwd(), argv.out), 'pdf')
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
      out: {
        alias: 'o',
        describe: 'data output path',
        type: 'string',
        default: 'form',
      },
    },

    handler(argv) {
      generate(resolve(cwd(), argv.json), argv.out)
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
