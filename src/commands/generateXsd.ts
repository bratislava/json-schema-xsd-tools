import chalk from 'chalk'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { cwd } from 'node:process'
import type { Arguments, CommandBuilder } from 'yargs'
import { fileExists } from '../utils/fsUtils'
import { BaseOptions, addDefaultOptions } from '../utils/yargsUtils'
import { loadAndBuildXsd } from '../core/forms'

type Options = BaseOptions & {
  template: string
  out: string
}

export const command = 'generate-xsd'
export const desc = 'generate XSD from JSON schema'

export const builder: CommandBuilder<Options, Options> = (yargs) =>
  addDefaultOptions(yargs).options({
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
  })

const generateXsd = async (
  jsonSchemaPath: string,
  identifier: string,
  version: string,
  templatePath: string,
  xsdPath: string
) => {
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
  console.log(identifier)
  const xsd = loadAndBuildXsd(JSON.parse(jsonSchemaBuffer.toString()), identifier, version, template)
  await writeFile(xsdPath, xsd)

  console.log(chalk.cyan.bold('generated: '), xsdPath)
}

export const handler = (argv: Arguments<Options>) => {
  generateXsd(
    resolve(cwd(), argv.json),
    argv.identifier,
    argv.ver,
    resolve(cwd(), argv.template),
    resolve(cwd(), argv.out)
  )
}
