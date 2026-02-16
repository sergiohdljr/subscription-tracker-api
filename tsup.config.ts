import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs'], // CommonJS para compatibilidade com Node.js
  target: 'node20',
  outDir: 'dist',
  clean: true,
  minify: process.env.NODE_ENV === 'production', // Minifica apenas em produção
  sourcemap: true, // Importante para debugging em produção
  splitting: false, // Single bundle para serverless
  treeshake: true, // Remove código não usado
  bundle: true,
  dts: false, // Não precisa de .d.ts para runtime
  esbuildOptions(options) {
    options.platform = 'node';
    // Resolve path aliases (@/* -> src/*)
    options.alias = {
      '@': './src',
    };
  },
  // tsup automaticamente trata node_modules como external
  // Mas podemos ser explícitos para dependências nativas
  external: [
    'pg-native', // Dependência nativa que não deve ser bundled
  ],
});
