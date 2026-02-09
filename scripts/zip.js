
import AdmZip from 'adm-zip';
import path from 'path';
import fs from 'fs';

const releasePath = 'C:\\Users\\abracadabra\\Downloads\\basehold.zip';
const distPath = path.resolve('dist');

console.log(`Starting zip process...`);
console.log(`Source: ${distPath}`);
console.log(`Destination: ${releasePath}`);

try {
    if (!fs.existsSync(distPath)) {
        console.error(`Error: dist folder not found at ${distPath}. Build failed?`);
        process.exit(1);
    }

    const zip = new AdmZip();
    zip.addLocalFolder(distPath);
    zip.writeZip(releasePath);

    console.log(`Successfully created zip at ${releasePath}`);
} catch (e) {
    console.error(`Error creating zip: ${e}`);
    process.exit(1);
}
