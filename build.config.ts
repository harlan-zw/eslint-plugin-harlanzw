import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [
    'src/index',
  ],
  declaration: 'node16',
  clean: true,
  externals: [
    '@eslint/plugin-kit',
    '@typescript-eslint/utils',
  ],
  rollup: {
    inlineDependencies: [
      '@antfu/utils',
    ],
  },
})
