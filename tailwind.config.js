/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			colors: {
				surface: {
					DEFAULT: '#13151a',
					raised: '#1b1e26',
					border: '#2a2e3a'
				}
			}
		}
	},
	plugins: []
};
