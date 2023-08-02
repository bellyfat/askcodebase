module.exports = {
  trailingComma: 'all',
  singleQuote: true,
  semi: false,
  printWidth: 100,
  jsxSingleQuote: true,
  arrowParens: 'avoid',
  importOrderSortSpecifiers: true,
  importOrder: [
    'react', // React
    '^react-.*$', // React-related imports
    '^.*/hooks/.*$', // Hooks
    '^.*/services/.*$', // Services
    '^.*/utils/.*$', // Utils
    '^.*/types/.*$', // Types
    '^.*/pages/.*$', // Components
    '^.*/components/.*$', // Components
    '^[./]', // Other imports
    '.*' // Any uncaught imports
  ]
}
