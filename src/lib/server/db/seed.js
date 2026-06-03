// @ts-nocheck
// Seed the publishers catalog (well-known comic + bande dessinée publishers).
// Idempotent and non-destructive: safe to run any time, incl. production.
//   npm run seed
// Series and authors are intentionally NOT seeded — they're entered via the CMS.
import Database from 'better-sqlite3';
import { readFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const slugify = (s) =>
	s.trim().toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '') || 'item';

// North American / English-language comics
const PUBLISHERS_US = [
	'Marvel Comics', 'DC Comics', 'Image Comics', 'Dark Horse Comics', 'IDW Publishing',
	'BOOM! Studios', 'Dynamite Entertainment', 'Valiant Comics', 'Oni Press', 'Fantagraphics Books',
	'Drawn & Quarterly', 'Archie Comics', 'Vertigo', 'WildStorm', 'Top Cow Productions',
	'Skybound Entertainment', 'AfterShock Comics', 'Vault Comics', 'Ahoy Comics', 'Black Mask Studios',
	'Avatar Press', 'Zenescope Entertainment', 'Titan Comics', 'Rebellion / 2000 AD', 'Humanoids',
	'First Second', 'Abrams ComicArts', 'Graphix', 'EC Comics', 'Charlton Comics',
	'Eclipse Comics', 'Malibu Comics', 'CrossGen'
];

// Franco-Belgian / European bande dessinée
const PUBLISHERS_BD = [
	'Dargaud', 'Dupuis', 'Le Lombard', 'Casterman', 'Glénat',
	'Delcourt', 'Soleil Productions', 'Les Humanoïdes Associés', 'Bamboo Édition', 'Bayard Éditions',
	'Futuropolis', 'Fluide Glacial', "L'Association", 'Cornélius', 'Ankama Éditions',
	'Rue de Sèvres', 'Vents d’Ouest', 'Urban Comics', 'Kana', 'Paquet',
	'Sergio Bonelli Editore', 'Panini Comics', 'Bao Publishing', 'Coconino Press', 'Norma Editorial',
	'ECC Ediciones', 'Astiberri Ediciones', 'NBM Publishing', 'SelfMadeHero', 'Europe Comics'
];

const PUBLISHERS = [...PUBLISHERS_US, ...PUBLISHERS_BD];

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(process.env.DATA_DIR ?? './data');
mkdirSync(join(DATA_DIR, 'covers'), { recursive: true });

const db = new Database(join(DATA_DIR, 'comics.sqlite'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.exec(readFileSync(join(__dirname, 'schema.sql'), 'utf8'));

const insPub = db.prepare('INSERT OR IGNORE INTO publishers (name, slug) VALUES (?, ?)');
let added = 0;
const run = db.transaction(() => {
	for (const name of PUBLISHERS) added += insPub.run(name, slugify(name)).changes;
});
run();

const total = db.prepare('SELECT COUNT(*) AS n FROM publishers').get().n;
console.log(`Издательства: +${added} (всего: ${total}).`);
db.close();
