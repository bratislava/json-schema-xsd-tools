import { describe, expect, test } from '@jest/globals'
import { validate } from './forms'

describe('json schema xsd tools', () => {
  test('validate schema', () => {
    expect(validate()).toBe(true)
  })
})
