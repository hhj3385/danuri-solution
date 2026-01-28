import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';
import postcss from 'rollup-plugin-postcss';

const production = process.env.BUILD === 'production';

export default {
  input: 'src/index.js',
  output: [
    {
      file: 'dist/danuri-widget.js',
      format: 'umd',
      name: 'DanuriWidget',
      sourcemap: !production
    },
    {
      file: 'dist/danuri-widget.esm.js',
      format: 'es',
      sourcemap: !production
    }
  ],
  plugins: [
    resolve({
      browser: true
    }),
    commonjs(),
    postcss({
      inject: true,
      minimize: production
    }),
    production && terser()
  ].filter(Boolean)
};
