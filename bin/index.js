#!/usr/bin/env node

const yargs = require('yargs')
const chalk = require('chalk')
const { readFile, writeFile, access } = require('node:fs/promises')
const { cwd } = require('node:process')
const { resolve } = require('node:path')
const { loadAndBuildXsd, loadAndValidate, loadAndBuildDefaultXslt, fakeData } = require('../dist/json-schema-xsd-tools')

async function fileExists(path) {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

const generateXsd = async (jsonSchemaPath, templatePath, xsdPath) => {
  if (!(await fileExists(jsonSchemaPath))) {
    console.log(chalk.red.bold('JSON schema not found'))
    return
  }

  let template;
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
  .demandCommand()
  .argv
