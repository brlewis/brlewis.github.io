import typescript from 'rollup-plugin-typescript';
import commonjs from 'rollup-plugin-commonjs';
import nodeResolve from 'rollup-plugin-node-resolve';

export default {
    entry: './index.tsx',
    dest: './index.js',
    format: 'iife',
    plugins: [
        typescript({
            typescript: require('typescript')
        }),
        nodeResolve({
            jsnext: true,
            main: true
        }),
        commonjs({
            include: 'node_modules/**',
            sourceMap: false,
        })
  ]
}
