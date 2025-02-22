export default {
  trailingComma: 'all',
  bracketSameLine: false,
  semi: true,
  singleQuote: true,
  plugins: ['@trivago/prettier-plugin-sort-imports'],
  importOrder: ['^@/(.*)$', '^[./]'],
  importOrderSeparation: true,
};
