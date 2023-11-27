/** @type {import('@sveltejs/kit').Config} */
import adapter from '@sveltejs/adapter-static';

const base = {
	production: '/visualisations/censusorigindestination',
	preview: '/census-od-tool',
	dev: ''
}; 

const mode = process.env.APP_ENV === 'preview' ? 'preview' : process.env.NODE_ENV === 'production' ? 'production' : 'dev';

const config = {
	kit: {
		// hydrate the <div id="svelte"> element in src/app.html
		adapter: adapter({
			// Options below are defaults
			pages: 'build',
			assets: 'build',
			strict: false
		}),
		prerender: {
			entries: ['/', '/embed'],
			handleHttpError: 'warn',
			handleMissingId: 'warn'
		},
		paths: {
			base: base[mode],
			relative: false
		}
	}
};

export default config;