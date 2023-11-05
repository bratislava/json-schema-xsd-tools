import type { Argv } from 'yargs'

export type BaseOptions = {
  json: string
  identifier: string
  ver: string
}

export const addDefaultOptions = (yargs: Argv<BaseOptions>) => {
  return yargs.options({
    json: {
      alias: 'j',
      describe: 'JSON schema path',
      demandOption: true,
      type: 'string',
    },
    identifier: {
      alias: 'i',
      describe: 'Form identifier',
      type: 'string',
      default: 'form',
    },
    ver: {
      alias: 'v',
      describe: 'Form version',
      type: 'string',
      default: '0.1',
    },
  })
}
