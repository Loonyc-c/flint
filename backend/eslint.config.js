import tseslint from 'typescript-eslint'
import prettierConfig from 'eslint-config-prettier'

export default tseslint.config(
  {
    files: ['**/*.ts'],
    ignores: ['node_modules/**', 'dist/**', 'lib/**', 'coverage/**'],
  },
  ...tseslint.configs.recommended,

  {
    files: ['v1/middleware/auth.middleware.ts'],
    rules: {
      '@typescript-eslint/no-namespace': 'off',
    },
  },

  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },

  prettierConfig,
)
