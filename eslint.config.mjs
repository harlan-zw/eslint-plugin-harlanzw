import antfu from '@antfu/eslint-config'

export default antfu(
  {
    type: 'lib',
  },
  {
    ignores: ['playground/**'],
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
    rules: {
      'ts/explicit-function-return-type': 'off',
    },
  },
)
