export default {
  input: './src/index.js',
  output: [
    {
      format: 'esm',
      file: './dist/proxy-observer.esm.js'
    },
    {
      name: 'ProxyObserver',
      format: 'umd',
      file: './dist/proxy-observer.js'
    }
  ]
}
