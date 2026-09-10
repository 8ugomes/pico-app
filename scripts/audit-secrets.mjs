import{readFileSync,readdirSync,existsSync,statSync}from'node:fs';import{execFileSync}from'node:child_process';import{parseEnv}from'node:util';
const tracked=execFileSync('git',['ls-files','-z'],{encoding:'utf8'}).split('\0').filter(Boolean),secrets=new Set();
for(const name of['.env.local','.env.hosted-admin','.env.beta.local','.env.beta-admin'])if(existsSync(name))for(const[k,v]of Object.entries(parseEnv(readFileSync(name,'utf8'))))if(/SECRET|PASSWORD|TOKEN/.test(k)&&!k.startsWith('NEXT_PUBLIC_')&&v.length>12)secrets.add(v);
if(!secrets.size)throw Error('Protected local secrets required for the exact-value audit');
if(tracked.some(f=>f.startsWith('.vercel/')||(f.startsWith('.env')&&f!=='.env.example')))throw Error('Protected files are tracked');
const build=process.env.PICO_BUILD_DIR||'.next',publicDir=build+'/static';if(!existsSync(publicDir))throw Error('Build the app before auditing public bundles');
const files=[...tracked.filter(f=>existsSync(f)&&statSync(f).isFile()),...readdirSync(publicDir,{recursive:true}).map(f=>publicDir+'/'+f).filter(f=>statSync(f).isFile())];
for(const file of files){const text=readFileSync(file,'utf8');if([...secrets].some(secret=>text.includes(secret)))throw Error('Protected value found in '+file);if(/sb_secret_[A-Za-z0-9_-]{20,}/.test(text))throw Error('Secret-shaped key found in '+file)}
console.log('Secret audit passed:',tracked.length,'tracked paths and',files.length-tracked.filter(f=>existsSync(f)&&statSync(f).isFile()).length,'public bundle files; no protected values found');
