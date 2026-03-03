import antfu from '@antfu/eslint-config'

export default antfu(
  {
    type: 'lib',
    markdown: {
      overrides: {
        'markdown/no-html': 'off',
      },
    },
  },
  {
    ignores: ['playground/**', 'src/rules/*.md', 'CLAUDE.md'],
  },
  // Markdown code blocks in rule docs contain multi-root Vue/JSX examples
  {
    files: ['src/rules/*.md/**'],
    rules: {
      'no-tabs': 'off',
      'style/no-tabs': 'off',
    },
  },
  {
    files: ['fixtures/**/*.ts'],
    rules: {
      'no-unused-vars': 'off',
      'unused-imports/no-unused-vars': 'off',
      'ts/explicit-function-return-type': 'off',
    },
  },
  {
    files: ['src/prompt/**/*.ts'],
    rules: {
      'no-cond-assign': 'off',
    },
  },
  {
    rules: {
      'ts/explicit-function-return-type': 'off',
    },
  },
)
