import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/register.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  external: ['@unipay/core', '@unipay/utils'],
});
