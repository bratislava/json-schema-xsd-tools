#!/usr/bin/env node

const yargs = require('yargs')
const chalk = require('chalk')
const { readFile, writeFile, access } = require('node:fs/promises')
const { cwd } = require('node:process')
const { resolve } = require('node:path')
const { loadAndBuildXsd, loadAndValidate } = require('../dist/json-schema-xsd-tools')
const defaultTemplate = require('./template')

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

  let template = defaultTemplate
  if (await fileExists(templatePath)) {
    const templateBuffer = await readFile(templatePath)
    template = templateBuffer.toString()
  }

  const jsonSchemaBuffer = await readFile(jsonSchemaPath)
  const xsd = loadAndBuildXsd(JSON.parse(jsonSchemaBuffer.toString()), template)
  await writeFile(xsdPath, xsd)

  console.log(chalk.cyan.bold('generated: '), xsdPath)
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

const options = yargs
  .usage('Usage: json-schema-xsd-tools <command> -t <template> -x <xsd> -j <json>')
  .command('generate-xsd', 'generate XSD from JSON schema')
  .command('validate', 'validate XSD against JSON schema')
  .option('t', { alias: 'template', describe: 'Template path', type: 'string' })
  .option('x', { alias: 'xsd', describe: 'XSD path', type: 'string' })
  .option('j', { alias: 'json', describe: 'JSON schema path', type: 'string' }).argv

const templatePath = options.template ? resolve(cwd(), options.template) : './template.xsd'
const xsdPath = resolve(cwd(), options.xsd || 'schema.xsd')
const jsonSchemaPath = resolve(cwd(), options.json || 'schema.json')

const command = yargs.argv._[0]
switch (command) {
  case 'generate-xsd':
    generateXsd(jsonSchemaPath, templatePath, xsdPath)
    break
  case 'validate':
    validate(jsonSchemaPath, xsdPath)
    break
  default:
    yargs.showHelp()
    break
}
