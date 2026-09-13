// Bounded concurrency and privacy checks in the exclusive development project.
import assert from 'node:assert/strict';
import {randomBytes,randomUUID} from 'node:crypto';
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createClient} from '@supabase/supabase-js';
import {createServerClient} from '@supabase/ssr';
import sharp from 'sharp';
import {assertRemoteIdentity} from '../scripts/environment-guard.mjs';
const env=await assertRemoteIdentity(process.env,'hosted-test');process.umask(0o077);
const origin='http://localhost:3002',url=env.url,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const admin=createClient(url,process.env.SUPABASE_SECRET_KEY,{auth:{persistSession:false,autoRefreshToken:false}}),users=[],checks=[],timings=[];
mkdirSync('.vercel/security-review',{recursive:true});
function check(value,label){assert.ok(value,label);checks.push(label);}
function ok(result,label){check(!result.error,label);return result.data;}
function sql(query){try{return JSON.parse(execFileSync('npx',['--yes','supabase@2.117.0','db','query','--linked',query,'--workdir','.vercel/db-development'],{encoding:'utf8',timeout:60000,stdio:['ignore','pipe','pipe']}));}catch{throw Error('Controlled development query failed');}}
async function request(user,path,{method='GET',body,from=origin,status=200}={}){
 const start=performance.now();const response=await fetch(origin+path,{method,headers:{Origin:from,'Content-Type':'application/json',Cookie:user?[...user.jar].map(([k,v])=>k+'='+v).join('; '):''},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(30000)});
 const data=await response.json();check(response.status===status,path.split('?')[0]+' status '+status+' actual '+response.status);check(response.headers.get('cache-control')?.includes('no-store'),'no private caching');
 return {response,data,ms:performance.now()-start};
}
async function account(n){
 const password=randomBytes(20).toString('hex'),email='pico-security-'+randomBytes(8).toString('hex')+'@example.com';
 const data=ok(await admin.auth.admin.createUser({email,password,email_confirm:true}),'create controlled account');
 const jar=new Map(),client=createServerClient(url,key,{cookies:{getAll:()=>[...jar].map(([name,value])=>({name,value})),setAll:entries=>entries.forEach(e=>e.value?jar.set(e.name,e.value):jar.delete(e.name))}});
 const user={id:data.user.id,password,jar,client};users.push(user);writeFileSync('.vercel/security-fixtures.json',JSON.stringify({projectRef:env.projectRef,users:users.map(u=>u.id)}));
 ok(await client.auth.signInWithPassword({email,password}),'controlled password login');
 ok(await client.from('profiles').update({display_name:'Pessoa de teste '+n,username:'sec_'+data.user.id.replaceAll('-','').slice(0,14),onboarding_completed:true}).eq('id',data.user.id),'controlled profile');
 return user;
}
let browser,group,debugPage,completed=false,load;
try{
 for(let n=0;n<8;n++)await account(n);
 const [a,b]=users;
 const post=ok(await a.client.rpc('publish_post',{p_key:randomUUID(),p_body:'<img src=x onerror="window.picoInjected=true"> Texto de teste.'}),'publish escaped test text');
 group=ok(await a.client.rpc('create_community',{p_data:{name:'Segurança grupo de teste',visibility:'private',entry_mode:'open',sports:[]}}),'private group').id;writeFileSync('.vercel/security-fixtures.json',JSON.stringify({projectRef:env.projectRef,users:users.map(u=>u.id),group}));
 const privatePost=ok(await a.client.rpc('publish_post',{p_key:randomUUID(),p_body:'Conteúdo privado controlado',p_audience:'private',p_groups:[group]}),'private post');
 check((await b.client.from('posts').select('id').eq('id',privatePost)).data.length===0,'direct Data API denies private content');
 for(const subject of [undefined,a,b]){
  const client=subject?.client||createClient(url,key,{auth:{persistSession:false}});
  check(Boolean((await client.rpc('export_account_data',{p_user:a.id})).error),'direct export RPC denied');
  check(Boolean((await client.rpc('erase_account_private_data',{p_user:a.id})).error),'direct erase RPC denied');
  check(Boolean((await client.schema('auth').from('users').select('encrypted_password')).error),'Auth credentials inaccessible');
 }
 await request(null,'/api/account/export',{method:'POST',body:{password:a.password},status:401});
 await request(a,'/api/account/export',{method:'POST',body:{password:a.password},from:'https://untrusted.example',status:403});
 await request(a,'/api/account/export',{method:'POST',body:{password:a.password,userId:b.id},status:400});
 await request(a,'/api/account/export',{method:'POST',body:{password:'wrong-password'},status:403});
 const archive=await request(a,'/api/account/export',{method:'POST',body:{password:a.password}});
 check(archive.data.account.id===a.id&&archive.data.data.posts.length===2,'export contains only own posts including private');
 check(!JSON.stringify(archive.data).includes(a.password),'export excludes password');check(archive.response.headers.get('content-disposition')?.includes('attachment'),'download response');
 // 8 simultaneous clients, 12 requests each, with no unbounded generator.
 const started=performance.now();await Promise.all(users.map(async user=>{
  for(let n=0;n<12;n++){
   const path=['/api/posts','/api/social/read?resource=profile','/api/games'][n%3];const result=await request(user,path);timings.push(result.ms);
   if(n%3===1)check(result.data.data.profile.id===user.id,'concurrent sessions isolated');
  }
 }));
 timings.sort((x,y)=>x-y);load={concurrency:8,requests:timings.length,errors:0,elapsedMs:Math.round(performance.now()-started),p50Ms:Math.round(timings[Math.floor(timings.length*.5)]),p95Ms:Math.round(timings[Math.floor(timings.length*.95)]),maxMs:Math.round(timings.at(-1)),scope:'Local production Next server plus hosted development Auth/Postgres; not a Vercel capacity guarantee'};
 check(load.p95Ms<5000,'bounded load p95 below 5 seconds');
 await Promise.all(Array.from({length:8},()=>request(b,'/api/posts',{method:'POST',body:{action:'repost',id:post,reposted:true}})));
 check((await admin.from('post_reposts').select('post_id').eq('player_id',b.id).eq('post_id',post)).data.length===1,'eight simultaneous repost requests remain idempotent');
 console.log('Concurrent reads and idempotent writes passed:',JSON.stringify(load));
 if(process.env.PLAYWRIGHT_MODULE){
  const {chromium}=await import(process.env.PLAYWRIGHT_MODULE);browser=await chromium.launch({channel:'chrome',headless:true});
  const context=await browser.newContext({viewport:{width:390,height:844},acceptDownloads:true});
  await context.addCookies([...a.jar].map(([name,value])=>({name,value,url:origin,sameSite:'Lax'})));
  await context.addInitScript(id=>localStorage.setItem('pico.tour.v1:account:'+id,JSON.stringify({version:1,status:'dismissed',step:0})),a.id);
  const page=await context.newPage(),errors=[];debugPage=page;page.on('pageerror',e=>errors.push(e.message));
  const first=await page.goto(origin+'/conta');await page.getByRole('button',{name:'Baixar meus dados',exact:true}).waitFor();
  const policy=first.headers()['content-security-policy'];check(policy.includes('strict-dynamic')&&!policy.includes("'unsafe-inline' 'strict-dynamic'"),'strict document policy served');
  const second=await context.request.get(origin+'/privacidade');check(policy!==second.headers()['content-security-policy'],'nonce differs between documents');
  // Insert into the HTML response: DevTools evaluation has privileged CSP semantics.
  await page.route('**/privacidade',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text()).replace('</body>','<script>window.picoInjected=true</script></body>')});});
  await page.goto(origin+'/privacidade');await page.getByRole('heading',{name:'Privacidade no Pico.'}).waitFor();
  check(await page.evaluate(()=>window.picoInjected!==true),'injected inline script in HTML blocked by CSP');
  await page.unroute('**/privacidade');
  await page.route('**/api/social/read?resource=profile',async route=>{await new Promise(resolve=>setTimeout(resolve,1500));await route.continue();});
  const preferences=page.waitForResponse(r=>r.url().endsWith('/api/social/read?resource=profile'));await page.goto(origin+'/conta');await page.getByRole('button',{name:'Baixar meus dados',exact:true}).waitFor();
  await page.getByRole('button',{name:'Baixar meus dados',exact:true}).click();await page.locator('#export-password').fill(a.password);await preferences;await page.locator('#export-password').waitFor({state:'visible'});check(await page.locator('#export-password').inputValue()===a.password,'late tutorial preferences preserve the open form');await page.unroute('**/api/social/read?resource=profile');
  const [file]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:'Baixar arquivo',exact:true}).click()]);
  check(JSON.parse(readFileSync(await file.path(),'utf8')).account.id===a.id,'real browser download verifies ownership');
  for(const [width,scheme] of [[390,'light'],[320,'dark']]){await page.setViewportSize({width,height:844});await page.emulateMedia({colorScheme:scheme});await page.getByRole('heading',{name:'Privacidade e conta.'}).click();await page.screenshot({path:'.vercel/security-review/account-'+width+'-'+scheme+'.png',fullPage:true});check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'account has no horizontal overflow');}
  await page.goto(origin+'/feed');await page.locator('.post-copy').filter({hasText:'Texto de teste.'}).waitFor();check(await page.evaluate(()=>window.picoInjected!==true),'post text never becomes executable HTML');
  check(errors.length===0,'no browser runtime errors');await context.close();
 }
 // Suspension blocks social reads but not reauthenticated rights.
 sql(`update pico_private.beta_admissions set status='suspended' where player_id='${a.id}'`);
 const suspended=await request(a,'/api/account/export',{method:'POST',body:{password:a.password}});check(suspended.data.account.id===a.id,'suspended account can export');
 // Real Storage pagination: 101 tiny owned objects, no other prefix touched.
 const bytes=await sharp({create:{width:1,height:1,channels:3,background:'#f2e3b5'}}).webp().toBuffer();
 for(let start=0;start<101;start+=10)await Promise.all(Array.from({length:Math.min(10,101-start)},(_,i)=>admin.storage.from('avatars').upload(`${b.id}/${String(start+i).padStart(4,'0')}.webp`,bytes,{contentType:'image/webp'}).then(r=>ok(r,'controlled media upload'))));
 await request(b,'/api/account',{method:'DELETE',body:{password:'123456',confirmation:'EXCLUIR'},status:403});
 await request(b,'/api/account',{method:'DELETE',body:{password:b.password,confirmation:'EXCLUIR'}});
 check((await admin.storage.from('avatars').list(b.id,{limit:1000})).data.length===0,'deletion removes more than one storage page');
 check(Boolean((await admin.auth.admin.getUserById(b.id)).error),'deleted account removed from Auth');
 completed=true;
}catch(error){if(debugPage&&!debugPage.isClosed())await debugPage.screenshot({path:'.vercel/security-review/failure.png',fullPage:true}).catch(()=>{});throw error;}finally{
 await browser?.close();
 if(users.length)ok(await admin.from('posts').delete().in('author_id',users.map(u=>u.id)),'owned test posts cleanup');
 if(group)sql(`delete from public.communities where id='${group}'`);
 for(const user of users){for(const bucket of ['avatars','post-media']){const listed=await admin.storage.from(bucket).list(user.id,{limit:1000});if(listed.error)throw Error('Controlled storage cleanup failed');if(listed.data.length)ok(await admin.storage.from(bucket).remove(listed.data.map(f=>user.id+'/'+f.name)),'test media cleanup');}const removed=await admin.auth.admin.deleteUser(user.id);if(removed.error&&removed.error.status!==404)throw Error('Controlled identity cleanup failed');}
 writeFileSync('.vercel/security-review/result.json',JSON.stringify({passed:completed,at:new Date().toISOString(),checks,load,cleanup:true},null,2));
 console.log('Security checks:',checks.length,'cleanup completed; passed:',completed);
}
