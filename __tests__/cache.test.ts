import { Cache } from '../src/cache'

describe('functions.ts', () => {
  it('Create cache set, get, and remove', async () => {
    const cache = new Cache('/tmp')

    const inv_key = await cache.get('invalid_key')
    expect(inv_key).toBeNull()

    await cache.set('valid_key', 'valid')
    const valid_key = await cache.get('valid_key')
    expect(valid_key).toBe('valid')

    await cache.remove('valid_key')
    const deleted = await cache.get('valid_key')
    expect(deleted).toBeNull()

    await cache.remove('invalid_key')
  })
})
