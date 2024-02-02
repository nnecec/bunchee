import fs from 'fs'
import { createCliTest, removeDirectory } from '../utils'

describe('cli', () => {
  it(`cli env-var should work properly`, async () => {
    const { code, distDir, distFile } = await createCliTest({
      directory: __dirname,
      args: ['index.js', '--env', 'MY_TEST_ENV', '-o', 'dist/index.js'],
      env: {
        MY_TEST_ENV: 'my-test-value',
      },
    })

    const content = fs.readFileSync(distFile, { encoding: 'utf-8' })
    expect(content.includes('my-test-value')).toBe(true)
    expect(code).toBe(0)

    await removeDirectory(distDir)
  })
})