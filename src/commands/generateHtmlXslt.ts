import { resolve } from 'node:path'
import { cwd } from 'node:process'
import type { Arguments, CommandBuilder } from 'yargs'
import { BaseOptions, addDefaultOptions } from '../utils/yargsUtils'
import { generateXslt } from './generateTextXslt'

type Options = BaseOptions & {
  out: string
}

export const command = 'generate-html-xslt'
export const desc = 'generate html stylesheet from JSON schema'

export const builder: CommandBuilder<Options, Options> = (yargs) =>
  addDefaultOptions(yargs).options({
    out: {
      alias: 'o',
      describe: 'xslt output path',
      type: 'string',
      default: 'form.html.xslt',
    },
  })

export const handler = (argv: Arguments<Options>) => {
  generateXslt(resolve(cwd(), argv.json), resolve(cwd(), argv.out), 'html', argv.identifier, argv.ver)
}
