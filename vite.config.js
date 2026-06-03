import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	// better-sqlite3 and sharp are native modules; keep them external from the SSR bundle.
	ssr: {
		external: ['better-sqlite3', 'sharp']
	}
});
