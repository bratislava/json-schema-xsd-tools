import chalk from 'chalk'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { cwd } from 'node:process'
import type { Arguments, CommandBuilder } from 'yargs'
import { fileExists } from '../utils/fsUtils'
import _ from 'lodash'
import type { BaseOptions } from '../utils/yargsUtils'

type Options = BaseOptions & {
  data: string
  fo: string
}

export const command = 'fop-data'
export const desc = 'generate request body for https://fop.dev.bratislava.sk/fop and places it into clipboard'

export const builder: CommandBuilder<Options, Options> = (yargs) =>
  yargs.options({
    data: {
      alias: 'd',
      describe: 'data.xml path',
      demandOption: true,
      type: 'string',
    },
    fo: {
      alias: 'f',
      describe: 'schema.fo.xslt path',
      demandOption: true,
      type: 'string',
    },
  })

const generateFakeData = async (dataPath: string, foPath: string) => {
  if (!(await fileExists(dataPath))) {
    console.log(chalk.red.bold('Input data xml file not found'))
    return
  }

  if (!(await fileExists(foPath))) {
    console.log(chalk.red.bold('Fo xslt schema not found'))
    return
  }

  const dataBuffer = await readFile(dataPath)
  const dataString = dataBuffer.toString()
  const foBuffer = await readFile(foPath)
  const foString = foBuffer.toString()
  // remove all whitespace adn newlines from both xmls
  const dataStringNoWhitespace = dataString
    .replace(new RegExp('\\n', 'g'), '')
    .replace(/\s*</g, '<')
    .replace(/>\s*/g, '>')
  const foStringNoWhitespace = foString.replace(new RegExp('\\n', 'g'), '').replace(/\s*</g, '<').replace(/>\s*/g, '>')

  const result = JSON.stringify({ data: dataStringNoWhitespace, xslt: foStringNoWhitespace })
  import('clipboardy')
    .then((module) => module.default)
    .then((clipboard) => {
      clipboard.writeSync(result)
      console.log(chalk.cyan.bold('📋 Body for fop-request copied to clipboard'))
    })
    .catch((err) => {
      console.log(chalk.red.bold('Error copying to clipboard'))
      console.log(err)
    })
}

export const handler = (argv: Arguments<Options>) => {
  console.log('correct handler')
  generateFakeData(resolve(cwd(), argv.data), resolve(cwd(), argv.fo))
}
