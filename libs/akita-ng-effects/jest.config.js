module.exports = {
  name: 'akita-ng-effects',
  preset: '../../jest.config.js',
  coverageDirectory: '../../coverage/libs/akita-ng-effects',
  snapshotSerializers: [
    'jest-preset-angular/build/AngularNoNgAttributesSnapshotSerializer.js',
    'jest-preset-angular/build/AngularSnapshotSerializer.js',
    'jest-preset-angular/build/HTMLCommentSerializer.js',
  ],
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
};
