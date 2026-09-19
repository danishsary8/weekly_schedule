import { describe, expect, it } from 'vitest'
import { describeApiError } from './apiError.js'

const axiosError = (status, data) => ({ response: { status, data } })
const envelope = (error) => ({ error })

describe('describeApiError', () => {
  it('names the field that was wrong instead of a generic failure', () => {
    const error = axiosError(422, envelope({
      code: 'validation_failed',
      message: 'The given data was invalid.',
      details: { name: ['The name field is required.'], weekdays: ['The weekdays field is required.'] },
    }))

    // "The given data was invalid." tells the user nothing actionable.
    expect(describeApiError(error)).toBe('The name field is required.')
  })

  it('falls back to the server message when there are no field details', () => {
    expect(describeApiError(axiosError(409, envelope({ message: 'That routine name is already taken.' }))))
      .toBe('That routine name is already taken.')
  })

  it('distinguishes an unreachable API from a rejected request', () => {
    // This is the case the old copy got wrong: no response means the server was
    // never reached, so "could not save" pointed the user at the wrong problem.
    expect(describeApiError(new Error('Network Error')))
      .toBe('Cannot reach Daycraft. Check your internet connection, then try again.')
  })

  it('recognises a timeout', () => {
    expect(describeApiError({ code: 'ECONNABORTED', message: 'timeout of 15000ms exceeded' }))
      .toBe('The server took too long to answer. Please try again.')
  })

  it('explains the statuses a user can act on', () => {
    expect(describeApiError(axiosError(401, {}))).toMatch(/session has expired/)
    expect(describeApiError(axiosError(403, {}))).toMatch(/permission/)
    expect(describeApiError(axiosError(404, {}))).toMatch(/no longer exists/)
    expect(describeApiError(axiosError(429, {}))).toMatch(/Too many attempts/)
    expect(describeApiError(axiosError(503, {}))).toMatch(/try again in a moment/)
  })

  it('uses the caller fallback only for an understood but unhelpful failure', () => {
    expect(describeApiError(axiosError(418, {}), 'Could not add that block.')).toBe('Could not add that block.')
  })

  it('never returns undefined, whatever it is handed', () => {
    for (const input of [null, undefined, 'string', 0, {}, { response: {} }]) {
      expect(typeof describeApiError(input)).toBe('string')
    }
  })
})
