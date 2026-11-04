const fs=require('node:fs');
const path=require('node:path');
const excluded=new Set(['node_modules','.next','.git','src/generated']);
function walk(dir='.') { for (const item of fs.readdirSync(dir,{withFileTypes:true})) {const name=path.join(dir,item.name);if(excluded.has(name))continue;if(item.isDirectory())walk(name);else if ((/^\.env/.test(item.name) && item.name!=='.env.example') || /\.(sqlite3?|db|pem|key)$/i.test(item.name)) throw Error(`sensitive file: ${name}`);}}
walk(); console.log('portfolio file checks passed');
