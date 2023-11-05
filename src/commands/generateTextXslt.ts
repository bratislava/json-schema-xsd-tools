import chalk from 'chalk'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { cwd } from 'node:process'
import type { Arguments, CommandBuilder } from 'yargs'
import { fileExists } from '../utils/fsUtils'
import { BaseOptions, addDefaultOptions } from '../utils/yargsUtils'
import { TransformationType, loadAndBuildDefaultXslt } from '../core/xslt'

type Options = BaseOptions & {
  out: string
}

export const command = 'generate-text-xslt'
export const desc = 'generate text stylesheet from JSON schema'

export const builder: CommandBuilder<Options, Options> = (yargs) =>
  addDefaultOptions(yargs).options({
    out: {
      alias: 'o',
      describe: 'xslt output path',
      type: 'string',
      default: 'form.sb.xslt',
    },
  })

export const generateXslt = async (
  jsonSchemaPath: string,
  xsltPath: string,
  transformationType: TransformationType,
  identifier: string,
  version: string
) => {
  if (!(await fileExists(jsonSchemaPath))) {
    console.log(chalk.red.bold('JSON schema not found'))
    return
  }

  const jsonSchemaBuffer = await readFile(jsonSchemaPath)
  const xslt = loadAndBuildDefaultXslt(JSON.parse(jsonSchemaBuffer.toString()), transformationType, identifier, version)
  await writeFile(xsltPath, xslt)
  console.log(chalk.cyan.bold('generated: '), xsltPath)
}

export const handler = (argv: Arguments<Options>) => {
  generateXslt(resolve(cwd(), argv.json), resolve(cwd(), argv.out), 'text', argv.identifier, argv.ver)
}
