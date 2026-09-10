import{readFileSync,writeFileSync,mkdirSync}from'node:fs';import{spawnSync}from'node:child_process';import{assertRemoteIdentity}from'./environment-guard.mjs';
const expected=await assertRemoteIdentity(process.env,'migration');const origins=expected.appOrigins;
if(!origins?.length)throw Error('Register validated application origins in config/environments.json first');
const wd='.vercel/auth-templates-'+expected.purpose;mkdirSync(wd+'/supabase/templates',{recursive:true});
for(const name of['confirmation','recovery']){let template=readFileSync('supabase/templates/'+name+'.html','utf8');const legacy=origins.map(o=>`(eq .RedirectTo "${o}/auth/callback")`).join(' ');template=template.replace(/{{ .RedirectTo }}#(?:email|recovery)={{ .TokenHash }}/,`{{ if or ${legacy} }}{{ .ConfirmationURL }}{{ else }}{{ .RedirectTo }}#${name==='recovery'?'recovery':'email'}={{ .TokenHash }}{{ end }}`);writeFileSync(wd+'/supabase/templates/'+name+'.html',template,{mode:0o600});}
const templates=process.env.NEXT_PUBLIC_PICO_EMAIL_TEMPLATES==='custom';
const redirects=origins.flatMap(o=>[o+'/auth/callback',o+'/auth/confirm']);
writeFileSync(wd+'/supabase/config.toml',`project_id = "pico-${expected.purpose}"
[auth]
site_url = ${JSON.stringify(origins[0])}
additional_redirect_urls = ${JSON.stringify(redirects)}
${templates?`[auth.email.template.confirmation]
subject = "Confirme seu e-mail no Pico"
content_path = "./supabase/templates/confirmation.html"
[auth.email.template.recovery]
subject = "Recuperar acesso ao Pico"
content_path = "./supabase/templates/recovery.html"`:""}
`,{mode:0o600});
function cli(command){const r=spawnSync('npx',['--yes','supabase@2.117.0','config',command,'--yes','--project-ref',expected.projectRef,'--workdir',wd],{encoding:'utf8',timeout:90000,maxBuffer:4e6});if(r.status!==0)throw Error('Auth configuration failed; inspect protected CLI output or provider settings');return r.stdout;}
const diff=cli('diff');writeFileSync(wd+'/review.diff',diff,{mode:0o600});
// This minimal config changes only origins/templates, never SMTP, admission,
// signup or verification settings. Keep the reviewed provider diff protected.
if(process.argv[2]==='apply'){cli('push');console.log('Auth origins applied; custom templates:',templates,expected.purpose,expected.projectRef)}else console.log('Auth diff prepared at',wd+'/review.diff');
