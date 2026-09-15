import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [
    'src/index',
    'src/tailwind',
  ],
  declaration: 'node16',
  clean: true,
  externals: [
    '@eslint/plugin-kit',
    '@tailwindcss/node',
    'postcss',
    'postcss-selector-parser',
    '@typescript-eslint/utils',
  ],
  rollup: {
    inlineDependencies: [
      '@antfu/utils',
    ],
  },
})
