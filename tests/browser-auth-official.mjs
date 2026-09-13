import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {mkdirSync,writeFileSync} from 'node:fs';
import {createClient} from '@supabase/supabase-js';
import {assertRemoteIdentity} from '../scripts/environment-guard.mjs';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
await assertRemoteIdentity(process.env,'hosted-test');
const admin=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SECRET_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const base='http://localhost:3002',folder='docs/official-review';mkdirSync(folder,{recursive:true});
const email='pico-ui-'+randomBytes(6).toString('hex')+'@example.com',password=randomBytes(18).toString('base64url')+'aA9!',errors=[],checks=[],layouts=[];let userId;
const browser=await chromium.launch({headless:true}),context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'}),page=await context.newPage();
page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push(e.message));
page.on('response',async response=>{if(response.url().includes('/auth/v1/signup')&&response.ok()){const d=await response.json();userId=d.user?.id;}});
try {
 await page.goto(base+'/signup');await page.getByLabel('Como você quer ser chamado?').fill('Jogadora de teste');await page.getByLabel('E-mail',{exact:true}).fill(email);await page.getByLabel('Senha',{exact:true}).fill(password);await page.getByRole('button',{name:'Criar conta',exact:true}).click();await page.waitForURL('**/perfil');await page.getByRole('heading',{name:'Seu lugar no Pico'}).waitFor();checks.push('real signup opens initial profile without invitation');
 const signupIdentity=await admin.auth.admin.listUsers({perPage:1000});userId??=signupIdentity.data.users.find(u=>u.email===email)?.id;assert.ok(userId);
 await page.getByLabel('Nome de usuário',{exact:true}).fill('ui_'+randomBytes(5).toString('hex'));await page.locator('select[name="sportId"]').selectOption({index:1});
 await page.getByText('Ao salvar, você entra na comunidade oficial do Pico', {exact:false}).waitFor();await page.getByRole('button',{name:'Salvar perfil',exact:true}).click();await page.getByRole('heading',{name:'Você entrou na comunidade oficial do Pico.'}).waitFor();checks.push('first profile saves and displays server-backed enrollment');
 const noticeTop=await page.getByRole('heading',{name:'Você entrou na comunidade oficial do Pico.'}).evaluate(e=>e.getBoundingClientRect().top);assert.ok(noticeTop>=0&&noticeTop<500,'notice is brought into view after save');checks.push('enrollment announcement is visible after long form');
 for(const width of [320,390,430,768]){await page.setViewportSize({width,height:844});const size=await page.evaluate(()=>({viewport:innerWidth,document:document.documentElement.scrollWidth}));assert.ok(size.document<=size.viewport+1,'welcome width '+width);layouts.push({width,...size});}
 await page.setViewportSize({width:390,height:844});await page.locator('.official-welcome').scrollIntoViewIfNeeded();await page.screenshot({path:folder+'/welcome-390.png'});
 await page.getByRole('button',{name:'Conhecer a comunidade',exact:true}).click();await page.waitForURL('**/comunidades/pico-oficial');await page.getByRole('heading',{name:'A areia aproxima. O Pico conecta.'}).waitFor();assert.equal(await page.getByRole('heading',{name:'Você entrou na comunidade oficial do Pico.'}).count(),0);checks.push('official editorial and server acknowledgment');
 await page.getByText('Sobre o grupo e participantes',{exact:true}).click();await page.getByRole('link',{name:'Jogadora de teste Participante'}).waitFor();checks.push('real participant links to profile');await page.screenshot({path:folder+'/community-390.png'});
 await page.getByText('Opções de participação',{exact:true}).click();await page.getByRole('button',{name:'Sair da comunidade',exact:true}).click();await page.getByText('Você saiu da comunidade.',{exact:true}).waitFor();await page.reload();await page.getByRole('button',{name:'Participar da comunidade',exact:true}).waitFor();checks.push('leaving survives reload without automatic rejoin');
 await page.goto(base+'/login');await page.getByRole('button',{name:'Sair da conta',exact:true}).click();await page.getByLabel('Senha',{exact:true}).waitFor();checks.push('real logout clears browser auth');
 await page.getByLabel('E-mail',{exact:true}).fill(email);await page.getByLabel('Senha',{exact:true}).fill('incorrect-password');await page.getByRole('button',{name:'Entrar',exact:true}).click();await page.getByText('E-mail ou senha incorretos.',{exact:false}).waitFor();checks.push('wrong-password feedback');
 await page.getByLabel('Senha',{exact:true}).fill(password);await page.getByRole('button',{name:'Entrar',exact:true}).click();await page.waitForURL('**/perfil');await page.getByRole('heading',{level:1}).waitFor();await page.goto(base+'/comunidades/pico-oficial');await page.getByRole('button',{name:'Participar da comunidade',exact:true}).waitFor();checks.push('login preserves voluntary departure');
 await page.evaluate(()=>document.documentElement.style.fontSize='200%');const enlarged=await page.evaluate(()=>({viewport:innerWidth,document:document.documentElement.scrollWidth}));assert.ok(enlarged.document<=enlarged.viewport+1);layouts.push({zoom:'200%',...enlarged});await page.screenshot({path:folder+'/community-200.png'});
 assert.deepEqual(errors,[]);checks.push('no browser runtime errors');
 const response=await page.request.get(base+'/login');assert.match(response.headers()['content-security-policy'],/frame-ancestors 'none'/);checks.push('frame protection header');
} finally {
 await browser.close();if(userId){const d=await admin.auth.admin.deleteUser(userId);assert.equal(d.error,null)}
 writeFileSync(folder+'/browser-results.json',JSON.stringify({environment:'exclusive development',checks,layouts,errors,emailDeliveryTested:false,realDevicesTested:false,fixtureRemoved:Boolean(userId)},null,2));console.log('Browser checks:',checks.length,'layouts:',layouts.length);
}
