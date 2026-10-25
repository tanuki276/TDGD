import {mkdir,copyFile,rm} from 'node:fs/promises';
await rm('dist',{recursive:true,force:true});await mkdir('dist');
for(const f of ['index.html','style.css','app.js','model.js','earth.js','specimen.js','cinema.js'])await copyFile(f,'dist/'+f);
console.log('Static client built; server source excluded.');
