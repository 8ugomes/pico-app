/** Bundle PNG renditions of the vector icon into a two-size ICO. */
import fs from 'node:fs';
import path from 'node:path';
const root=path.dirname(new URL(import.meta.url).pathname);
const sizes=[16,32],images=sizes.map(n=>fs.readFileSync(path.join(root,`logo/favicon-${n}.png`)));
const header=Buffer.alloc(6+16*sizes.length);header.writeUInt16LE(1,2);header.writeUInt16LE(sizes.length,4);let offset=header.length;
sizes.forEach((n,i)=>{let p=6+i*16;header[p]=n;header[p+1]=n;header.writeUInt16LE(1,p+4);header.writeUInt16LE(32,p+6);header.writeUInt32LE(images[i].length,p+8);header.writeUInt32LE(offset,p+12);offset+=images[i].length;});
fs.writeFileSync(path.join(root,'logo/favicon.ico'),Buffer.concat([header,...images]));
console.log('Favicon: 16 and 32 px.');
