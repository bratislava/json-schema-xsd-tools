import chalk from 'chalk'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { cwd } from 'node:process'
import { type Arguments, type Argv } from 'yargs'
import { fileExists } from '../utils/fsUtils'
import xmlTemplate from '../templates/template.xml'
import _ from 'lodash'
import type { BaseOptions } from '../utils/yargsUtils'
import { emptyXml, fakeData } from '../core/forms'
import { formatUnicorn } from '../core/strings'

type Options = BaseOptions & {
  out: string
  gestor: string
}

export const command = 'fake-data'
export const desc = 'generate mock data from JSON schema'

export const builder = (yargs: Argv<Options>) =>
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
    gestor: {
      alias: 'g',
      describe: 'gestor - person submitting the form to NASES',
      type: 'string',
      default: 'Tisici Janko',
    },
    identifier: {
      alias: 'i',
      describe: 'identifier used when submitting to NASES',
      type: 'string',
    },
    ver: {
      alias: 'v',
      describe: 'posp version',
      type: 'string',
    },
  })

// generates json as well as xml - the xml should be added as data.xml to submitted form
const generateFakeData = async (
  jsonSchemaPath: string,
  dataPath: string,
  identifier: string,
  version: string,
  gestor: string
) => {
  if (!(await fileExists(jsonSchemaPath))) {
    console.log(chalk.red.bold('JSON schema not found'))
    return
  }

  const jsonSchemaBuffer = await readFile(jsonSchemaPath)
  const parsedSchema = JSON.parse(jsonSchemaBuffer.toString())
  const data = fakeData(parsedSchema)

  await writeFile(dataPath, JSON.stringify(data))

  await writeFile(
    dataPath.replace('.json', '.xml'),
    // TODO when we start dealing with ZEP add zepRequired as input param
    formatUnicorn(xmlTemplate, {
      eformIdentifier: identifier,
      eformVersion: version,
      gestor,
      zepRequired: '0',
      body: await emptyXml(parsedSchema),
    })
  )

  console.log(chalk.cyan.bold('generated: '), dataPath)
}

export const handler = (argv: Arguments<Options>) => {
  generateFakeData(resolve(cwd(), argv.json), resolve(cwd(), argv.out), argv.identifier, argv.ver, argv.gestor)
}
