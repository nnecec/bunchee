import { assertFilesContent, createIntegrationTest } from '../utils'

describe('integration postcss', () => {
  it('should compile tailwind class', async () => {
    await createIntegrationTest(
      {
        directory: __dirname,
      },
      async ({ distDir }) => {
        await assertFilesContent(distDir, {
          './index.js': '.mb-8{margin-bottom:2rem}h1{font-size:10px}',
        })
      },
    )
  })
})
