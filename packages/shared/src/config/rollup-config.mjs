import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import babel from "@rollup/plugin-babel";
import ts from "rollup-plugin-ts";

export const pkgConfig = {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/index.js',
      format: 'cjs',
      sourcemap: true,
    },
    {
      file: 'dist/index.mjs',
      format: 'es',
      sourcemap: true,
    },
  ],
  plugins: [
    resolve(),
    commonjs(),
    babel({
      babelHelpers: 'bundled',
      exclude: 'node_modules/**',
    }),
    ts({
      tsconfig: 'tsconfig.json',
    }),
  ],
  external: ['preact', 'preact/hooks', 'preact/compat', '@preact/signals', 'preact/src/jsx', 'preact/jsx-runtime'],
}
