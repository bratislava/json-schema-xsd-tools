import { loadAndValidate } from '@bratislava/json-schema-xsd-tools'
import chalk from 'chalk'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { cwd } from 'node:process'
import type { Arguments, CommandBuilder } from 'yargs'
import { fileExists } from '../utils/fsUtils'

type Options = {
  json: string
  xsd: string
}

export const command = 'validate'
export const desc = 'validate XSD against JSON schema'

export const builder: CommandBuilder<Options, Options> = (yargs) =>
  yargs.options({
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
  })

const validate = async (jsonSchemaPath: string, xsdPath: string) => {
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

export const handler = (argv: Arguments<Options>) => {
  validate(resolve(cwd(), argv.json), resolve(cwd(), argv.xsd))
}
