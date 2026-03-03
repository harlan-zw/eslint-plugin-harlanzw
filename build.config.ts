import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [
    'src/index',
  ],
  declaration: 'node16',
  clean: true,
  externals: [
    '@typescript-eslint/utils',
    '@eslint/plugin-kit',
  ],
  rollup: {
    inlineDependencies: [
      '@antfu/utils',
    ],
  },
})
