import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/supabase/queries';
import { apiError, jsonBody, privateHeaders, sameOrigin } from '@/lib/supabase/api';
import { exactKeys, MutationError, mutationFailure } from '@/lib/supabase/mutations';
export const dynamic='force-dynamic';
export async function GET(){try{const c=await createClient();if(!c)throw new MutationError(503,'Configuração indisponível.');await requireUser(c);const{data,error}=await c.rpc('beta_status');if(error)mutationFailure(error);return Response.json(data,{headers:privateHeaders});}catch(e){return apiError(e)}}
export async function POST(request:Request){try{sameOrigin(request);const b=await jsonBody(request);exactKeys(b,['token']);if(typeof b.token!=='string'||!/^[a-f0-9]{64}$/.test(b.token))throw new MutationError(400,'Convite inválido.');const c=await createClient();if(!c)throw new MutationError(503,'Configuração indisponível.');await requireUser(c);const{data,error}=await c.rpc('accept_beta_invite',{p_token:b.token});if(error)throw new MutationError(403,'O convite não está disponível para esta conta. Confira o e-mail, a validade e a confirmação.');return Response.json(data,{headers:privateHeaders});}catch(e){return apiError(e)}}
