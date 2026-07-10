module.exports = function (api) {
  const isTest = api.env('test');
  api.cache(!isTest);

  if (isTest) {
    // Jest 환경: nativewind 플러그인 제외 (babel/core 호환성 이슈)
    return {
      presets: ['babel-preset-expo'],
    };
  }

  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
    ],
    plugins: ['nativewind/babel'],
  };
};
