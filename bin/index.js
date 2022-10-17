#!/usr/bin/env node

const yargs = require('yargs')
const chalk = require('chalk')
const { readFile, writeFile } = require('node:fs/promises')
const { cwd } = require('node:process')
const { resolve } = require('node:path')
const { loadAndBuildXsd, loadAndValidate } = require('../dist/json-schema-xsd-tools')

const generateXsd = async (jsonSchemaPath, templatePath, xsdPath) => {
  const templateBuffer = await readFile(templatePath)
  const jsonSchemaBuffer = await readFile(jsonSchemaPath)

  const xsd = loadAndBuildXsd(JSON.parse(jsonSchemaBuffer.toString()), templateBuffer.toString())
  await writeFile(xsdPath, xsd)
}

const validate = async (jsonSchemaPath, xsdPath) => {
  const jsonSchemaBuffer = await readFile(jsonSchemaPath)
  const xsdSchemaBuffer = await readFile(xsdPath)

  return loadAndValidate(xsdSchemaBuffer.toString(), JSON.parse(jsonSchemaBuffer.toString()))
}

const options = yargs
  .usage('Usage: json-schema-xsd-tools <command> -t <template> -x <xsd> -j <json>')
  .option('t', { alias: 'template', describe: 'Template path', type: 'string' })
  .option('x', { alias: 'xsd', describe: 'XSD path', type: 'string' })
  .option('j', { alias: 'json', describe: 'JSON schema path', type: 'string' }).argv

const templatePath = resolve(cwd(), options.template || 'template.xsd')
const xsdPath = resolve(cwd(), 'forms', options.xsd || 'schema.xsd')
const jsonSchemaPath = resolve(cwd(), options.json || 'schema.json')

const command = yargs.argv._[0]
switch (command) {
  case 'generate-xsd':
    generateXsd(jsonSchemaPath, templatePath, xsdPath).then(() => {
      console.log(chalk.cyan.bold('generated: '), xsdPath)
    })
    break
  case 'validate':
    validate(jsonSchemaPath, xsdPath).then((errors) => {
      if (errors.length === 0) {
        console.log(chalk.cyan.bold('valid'))
      } else {
        console.log(chalk.red.bold('errors:'))
        errors.forEach((error) => {
          console.log(`${chalk.red.bold(error.type)} at ${error.path.join('.')}`)
        })
      }
    })
    break
  default:
    yargs.showHelp()
    break
}
