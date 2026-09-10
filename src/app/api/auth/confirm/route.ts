import{createClient}from'@/lib/supabase/server';
import{apiError,jsonBody,privateHeaders,sameOrigin}from'@/lib/supabase/api';
import{exactKeys,MutationError}from'@/lib/supabase/mutations';
export const dynamic='force-dynamic';
export async function POST(request:Request){try{sameOrigin(request);const b=await jsonBody(request);exactKeys(b,['type','token_hash']);if(!['email','recovery'].includes(String(b.type))||typeof b.token_hash!=='string'||!/^[a-zA-Z0-9_-]{20,128}$/.test(b.token_hash))throw new MutationError(400,'Link inválido. Peça um novo e-mail.');const c=await createClient();if(!c)throw new MutationError(503,'Acesso indisponível.');const r=await c.auth.verifyOtp({type:b.type as'email'|'recovery',token_hash:b.token_hash});if(r.error||!r.data.user)throw new MutationError(400,'Link inválido, expirado ou já utilizado. Peça outro e-mail.');return Response.json({next:b.type==='recovery'?'/redefinir-senha':'/perfil'},{headers:privateHeaders});}catch(e){return apiError(e)}}
