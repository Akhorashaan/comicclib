// See https://svelte.dev/docs/kit/types#app.d.ts
import type { SeriesDetail } from '$lib/server/queries';

declare global {
	namespace App {
		interface Locals {
			/** True when the request carries a valid admin session cookie. */
			isAdmin: boolean;
		}
		interface PageState {
			/** Series payload for the shallow-routed detail modal. */
			selected?: SeriesDetail;
		}
		// interface Error {}
		// interface Platform {}
	}
}

export {};
