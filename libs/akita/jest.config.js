module.exports = {
  name: 'akita',
  preset: '../../jest.config.js',
  transform: {
    '^.+\\.[tj]sx?$': 'ts-jest',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'html'],
  coverageDirectory: '../../coverage/libs/akita',
  globals: {
    'ts-jest': {
      diagnostics: false, // TODO turn on
    },
  },
};
