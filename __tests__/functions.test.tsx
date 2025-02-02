//app.test.tsx
global.fetch = jest.fn(async () =>
  Promise.resolve({
    ok: true,
    json: async () => Promise.resolve({ id: 0 }),
    text: async () => Promise.resolve('text')
  })
) as jest.Mock
