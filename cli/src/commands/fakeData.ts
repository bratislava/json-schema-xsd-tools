import { fakeData } from '@bratislava/json-schema-xsd-tools'
import chalk from 'chalk'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { cwd } from 'node:process'
import type { Arguments, CommandBuilder } from 'yargs'
import { fileExists } from '../utils/fsUtils'

type Options = {
  json: string
  out: string
}

export const command = 'fake-data'
export const desc = 'generate mock data from JSON schema'

export const builder: CommandBuilder<Options, Options> = (yargs) =>
  yargs.options({
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
  })

const generateFakeData = async (jsonSchemaPath: string, dataPath: string) => {
  if (!(await fileExists(jsonSchemaPath))) {
    console.log(chalk.red.bold('JSON schema not found'))
    return
  }

  const jsonSchemaBuffer = await readFile(jsonSchemaPath)
  const data = fakeData(JSON.parse(jsonSchemaBuffer.toString()))
  await writeFile(dataPath, JSON.stringify(data))
  console.log(chalk.cyan.bold('generated: '), dataPath)
}

export const handler = (argv: Arguments<Options>) => {
  generateFakeData(resolve(cwd(), argv.json), resolve(cwd(), argv.out))
}
