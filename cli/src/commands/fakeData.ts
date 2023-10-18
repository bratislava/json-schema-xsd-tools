import { fakeData, formatUnicorn } from '@bratislava/json-schema-xsd-tools'
import chalk from 'chalk'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { cwd } from 'node:process'
import type { Arguments, CommandBuilder } from 'yargs'
import { fileExists } from '../utils/fsUtils'
import { toXML } from 'jstoxml'
import xmlTemplate from '../templates/template.xml'
import _ from 'lodash'
import type { BaseOptions } from '../utils/yargsUtils'

type Options = BaseOptions & {
  out: string
  gestor: string
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

// generates json as well as xml - the xml should be added as data.xml to submitted form
const generateFakeData = async (jsonSchemaPath: string, dataPath: string, identifier: string, version: string, gestor: string) => {
  if (!(await fileExists(jsonSchemaPath))) {
    console.log(chalk.red.bold('JSON schema not found'))
    return
  }

  const jsonSchemaBuffer = await readFile(jsonSchemaPath)
  const data = fakeData(JSON.parse(jsonSchemaBuffer.toString()))

  // build xml from js data
  // TODO would consider moving to core, but presently were contemplating merging the two bundles into one
  // a recursive function that converts all keys to PascalCase, then transformed and used as <TagNames> in output xml
  const toPascalCase = (data: any): any => {
    if (typeof data !== 'object') {
      return data
    }
    if (Array.isArray(data)) {
      return data.map((item) => toPascalCase(item))
    }
    const result: any = {}
    for (const key in data) {
      result[_.upperFirst(key)] = toPascalCase(data[key])
    }
    return result
  }
  const xmldata = toXML(toPascalCase(data), { indent: '  ' })
  await writeFile(dataPath, JSON.stringify(data))

  await writeFile(
    dataPath.replace('.json', '.xml'),
    // TODO when we start dealing with ZEP add zepRequired as input param
    formatUnicorn(xmlTemplate, { eformIdentifier: identifier, eformVersion: version, gestor, zepRequired: '0', body: xmldata })
  )

  console.log(chalk.cyan.bold('generated: '), dataPath)
}

export const handler = (argv: Arguments<Options>) => {
  generateFakeData(resolve(cwd(), argv.json), resolve(cwd(), argv.out), argv.identifier, argv.ver, argv.gestor)
}
