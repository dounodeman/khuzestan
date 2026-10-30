// Regenerates docs/vehicle_sheets.md from data/vehicle_sheets/*.json: npm run sheets-doc.
import fs from 'node:fs';
import { DOC_PATH, loadSheets, renderDoc } from './sheets-lib';

fs.writeFileSync(DOC_PATH, renderDoc(loadSheets()));
console.log(`wrote ${DOC_PATH}`);
