import { upazilas_en } from 'bangladesh-location-data';
import { slugify } from './lib/slugify.js';

const allThanas = Object.values(upazilas_en).flat().map(t => slugify(t.title));
const unique = new Set(allThanas);
console.log('Total Thanas:', allThanas.length);
console.log('Unique Slugs:', unique.size);
