import { FilterPattern, createFilter } from '@rollup/pluginutils'
import { Module } from 'module'
import { Plugin } from 'rollup'
import postcssrc, { Result } from 'postcss-load-config'
import { memoizeByKey } from '../lib/memoize'

const resolvePostcssHandler = async (
  cwd: string,
): Promise<typeof import('postcss')> => {
  let postcss
  const m = new Module('', undefined)
  m.paths = (Module as any)._nodeModulePaths(cwd)
  try {
    postcss = m.require('postcss')
  } catch (e) {
    console.warn(
      'If you want to use PostCSS, try to install `postcss` as dev dependency',
    )
  }

  return postcss
}

const resolvePostcss = memoizeByKey(resolvePostcssHandler)()

const resolvePostcssConfig = async (cwd: string) => {
  let config: Result | undefined = undefined
  try {
    config = await postcssrc({ cwd }, cwd)
  } catch (err: any) {
    if (!err.message.includes('No PostCSS Config found in')) {
      throw new Error(err)
    }
  }
  return config
}

export function postcss(options: {
  exclude?: FilterPattern
  cwd: string
}): Plugin {
  const filter = createFilter(['**/*.css'], options.exclude ?? [])

  return {
    name: 'postcss-plugin',
    async transform(code, id) {
      if (!filter(id)) return

      const { cwd } = options
      const postcss = await resolvePostcss(cwd)
      const postcssConfig = await resolvePostcssConfig(cwd)

      // if there are no postcss or postcss.config, don't do anything
      if (!postcss || !postcssConfig) {
        return { code, map: null }
      }

      const originCwd = process.cwd()
      const needChdir = cwd !== originCwd
      if (needChdir) {
        // eg. tailwind not support postcssrc cwd
        process.chdir(cwd)
      }
      const result = await postcss
        .default(postcssConfig.plugins ?? [])
        .process(code, {
          from: id,
          to: id,
          map: { inline: true },
          ...postcssConfig.options,
        })
      if (needChdir) {
        process.chdir(originCwd)
      }

      for (const warning of result.warnings()) {
        this.warn(warning.text, {
          column: warning.column,
          line: warning.line,
        })
      }
      const outputMap = result.map && JSON.parse(result.map.toString())

      return {
        code: result.css,
        map: outputMap ?? { mappings: '' },
      }
    },
  }
}
