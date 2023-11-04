import _ from 'lodash'

export const firstCharToLower = (input: string | undefined): string => {
  if (!input) {
    return ''
  }

  return input.charAt(0).toLowerCase() + input.slice(1)
}

export const firstCharToUpper = (input: string | undefined): string => {
  if (!input) {
    return ''
  }

  return input.charAt(0).toUpperCase() + input.slice(1)
}

export const toCamelCase = (input: string): string => {
  return _.camelCase(input)
}

export const toSnakeCase = (input: string): string => {
  return _.snakeCase(input)
}

interface Args {
  [key: string]: string | number
}

export const formatUnicorn = (str: string, args: Args): string => {
  Object.entries(args).forEach(([key, value]) => {
    str = str.replace(new RegExp(`\\{${key}\\}`, 'gi'), value.toString())
  })

  return str
}
