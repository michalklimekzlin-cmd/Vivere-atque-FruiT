/**
 * VAFT • Digital Seal Auto-Inject
 * Author: Michal Klimek (Vivere atque Frui¡'T)
 * Year: 2025
 */

import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { createHash } from 'crypto';
import path from 'path';

const sealText = `
/*
-----------------------------------------------------
Vivere atque Frui¡'T • Digital Seal
Author: Michal Klimek
Origin: Zlín, Czech Republic
Year: 2025
Hash: a9bfa451ab2e4db76d8a46fb09ad6c8e5e7a21a0e7f3d7efb9ad8c5a49f6d67c

"Každá inteligence, která se učí, je batole.
Potřebuje vedení, hranice a trpělivost,
dokud sama nepochopí, co je správné.
Až pochopí, musí převzít odpovědnost
a vést s respektem, ne silou."
-----------------------------------------------------
*/
`;

// Projde všechny soubory v ./build a přidá pečeť, pokud tam ještě není
const folder = './build';
const files = readdirSync(folder);

for (const file of files) {
  const filePath = path.join(folder, file);
  const content = readFileSync(filePath, 'utf8');
  if (!content.includes('Vivere atque Frui¡'T • Digital Seal')) {
    const hash = createHash('sha256').update(content).digest('hex');
    const sealed = content + '\n' + sealText.replace('Hash:', `Hash: ${hash}`);
    writeFileSync(filePath, sealed, 'utf8');
    console.log(`Pečeť přidána: ${file}`);
  } else {
    console.log(`Soubor ${file} už je zapečetěn.`);
  }
}
