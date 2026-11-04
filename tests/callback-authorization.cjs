const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const handlers = {};
let record = {id: 1, userId: 42n, status:'awaitingConfirmation', calories:100, protein:10, fat:3, carbs:8, description:'meal'};
let writes = 0;
const prisma = {pendingMeal: {
  findUnique: async ({where}) => where.id === record?.id ? record : null,
  update: async ({where,data}) => {if (!record || where.id !== record.id || where.userId !== record.userId) throw Error('not found'); writes++; return Object.assign(record,data)},
  delete: async () => {writes++; record = null;}
}, meal: {create: async () => {writes++;}}};
class Bot { command() {} on() {} callbackQuery(re, fn) {handlers[re.source.startsWith('^confirm')?'confirm':'edit']=fn} catch() {} }
const source = ts.transpileModule(fs.readFileSync('src/lib/bot.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
const exportsObj = {};
vm.runInNewContext(source, {exports:exportsObj,require:(name)=> name==='grammy'?{Bot}:name==='@/lib/prisma'?{prisma}:name==='@/lib/gemini'?{}:require(name),process:{env:{TELEGRAM_BOT_TOKEN:'test'}},console,Buffer});
exportsObj.getBot();
function ctx(user){return {from:user === null ? undefined : {id:user},match:['', '1'],answerCallbackQuery:async()=>{},editMessageText:async()=>{}}}
(async()=>{
 await handlers.confirm(ctx(99)); assert.equal(writes,0,'other user cannot confirm');
 await handlers.confirm(ctx(null)); assert.equal(writes,0,'missing user cannot confirm');
 await handlers.edit(ctx(99)); assert.equal(writes,0,'other user cannot edit');
 await handlers.edit(ctx(null)); assert.equal(writes,0,'missing user cannot edit');
 await handlers.edit(ctx(42)); assert.equal(writes,1,'owner can edit');
 record.status='awaitingConfirmation';
 await handlers.confirm(ctx(42)); assert.equal(writes,3,'owner can confirm');
 console.log('callback authorization checks passed');
})().catch(e=>{console.error(e);process.exitCode=1});
