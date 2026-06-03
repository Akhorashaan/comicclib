import { randomBytes } from 'node:crypto';
import { unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';
import { COVERS_DIR } from './paths';

const MAX_WIDTH = 640; // cover display width; keeps files small for a small server

/**
 * Resize an uploaded image to a capped width, re-encode as WebP, and store it
 * under COVERS_DIR. Returns the stored filename (to save in series.cover_path).
 */
export async function saveCover(input: Buffer): Promise<string> {
	const name = `${randomBytes(12).toString('hex')}.webp`;
	const out = await sharp(input)
		.rotate() // honor EXIF orientation
		.resize({ width: MAX_WIDTH, withoutEnlargement: true })
		.webp({ quality: 80 })
		.toBuffer();
	await writeFile(join(COVERS_DIR, name), out);
	return name;
}

export async function deleteCover(name: string | null | undefined) {
	if (!name) return;
	try {
		await unlink(join(COVERS_DIR, name));
	} catch {
		// already gone — ignore
	}
}
