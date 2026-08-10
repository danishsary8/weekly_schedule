import { beforeEach, describe, expect, it, vi } from 'vitest'
import api from './api/client.js'
import { trackEvent, trackNotificationPermission, trackPageView } from './analytics.js'

vi.mock('./api/client.js', () => ({ default: { post: vi.fn(() => Promise.resolve()) } }))

describe('privacy-safe analytics client', () => {
  beforeEach(() => api.post.mockClear())

  it('counts a navigation key once and sends no query string or user data', () => {
    trackPageView('route-key-one', '/privacy')
    trackPageView('route-key-one', '/privacy')
    expect(api.post).toHaveBeenCalledTimes(1)
    expect(api.post).toHaveBeenCalledWith('/analytics/page-view', {
      path: '/privacy',
      idempotency_key: expect.stringMatching(/^[0-9a-f-]{36}$/),
    })
  })

  it('reports only the allow-listed event name and an idempotency key', () => {
    trackEvent('notification_permission_granted')
    expect(api.post).toHaveBeenCalledWith('/analytics/event', {
      event: 'notification_permission_granted',
      idempotency_key: expect.stringMatching(/^[0-9a-f-]{36}$/),
    })
  })

  it('ignores unsupported permission outcomes', async () => {
    await trackNotificationPermission('default')
    expect(api.post).not.toHaveBeenCalled()
    await trackNotificationPermission('denied')
    expect(api.post).toHaveBeenCalledTimes(1)
  })
})
