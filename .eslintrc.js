module.exports = {
  root: true,
  env: {
    node: true
  },
  extends: ['plugin:vue/recommended', 'plugin:import/warnings', 'plugin:promise/recommended'],
  plugins: ['import', 'promise'],
  rules: {
    // 关闭 禁止使用console，生产环境不能使用console
    'no-console': 'off',
    // 关闭 使用debugger，生产环境不能使用
    'no-debugger': 'off',
    // 关闭 禁止对函数参数再赋值，在使用map时会使用参数更改
    'no-param-reassign': 'off',
    // 关闭 强制 generator 函数中 * 号周围有空格
    'generator-star-spacing': 'off',
    // 强制缩进2格
    indent: ['error', 2],
    // 关闭 禁用不必要的转义字符
    'no-useless-escape': 'off',
    // 关闭 使用eval
    'no-eval': 'off',
    // 关闭 禁用未声明的变量
    'no-undef': 'off',
    // 开启 禁止使用拖尾逗号
    'comma-dangle': ['error', 'never'],
    // 关闭函数名()的前面加空格
    'space-before-function-paren': 'off',
    // 关闭代码末尾空行
    'no-trailing-spaces': 'off',
    // 禁止块内填充(不加多的空行)
    'padded-blocks': ['error', 'never'],
    // 不允许空行
    'no-empty': 'error',
    // 禁用封号
    semi: ['error', 'never'],
    // 允许全局属性的使用，比如isNaN()
    'no-restricted-globals': ['error', 'event'],
    // 允许函数根据代码分支有不同的return行为,可以return,也可以return false
    'consistent-return': 'off',
    // 关闭对function是否命名的禁用
    'func-names': 'off',
    // 关闭对continue的禁用
    'no-continue': 'off',
    // 关闭在数组里面必须return
    'array-callback-return': 'off',
    // 关闭禁止使用特定的语法
    'no-restricted-syntax': 'off',
    // 要求箭头函数的参数使用圆括号，且当只有一个参数不需要括号
    // 'arrow-parens': ['error', 'as-needed'],
    'arrow-parens': 'off',
    // eslint-plugin-promise
    "promise/always-return": "off",
    "promise/no-return-wrap": "error",
    "promise/param-names": "error",
    "promise/catch-or-return": "error",
    "promise/no-native": "off",
    "promise/no-nesting": "warn",
    "promise/no-promise-in-callback": "warn",
    "promise/no-callback-in-promise": "warn",
    "promise/avoid-new": "warn",
    "promise/no-new-statics": "error",
    "promise/no-return-in-finally": "warn",
    "promise/valid-params": "warn",
    // eslint-plugin-vue
    'vue/require-default-prop': 'warning',
    'vue/no-v-html': 'warning',
    'vue/no-use-v-if-with-v-for': 'off'
  },
  parserOptions: {
    parser: 'babel-eslint'
  }
}
