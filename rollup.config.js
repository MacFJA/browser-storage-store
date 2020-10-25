import resolve from '@rollup/plugin-node-resolve';
import pkg from './package.json';

const name = "browser-storage-store";

export default {
	input: 'src/index.js',
	output: [
		{ file: pkg.module, 'format': 'es' },
		{ file: pkg.main, 'format': 'umd', name }
	],
	plugins: [
		resolve()
	]
};
