import{createClient}from'@/lib/supabase/server';
import{requireUser}from'@/lib/supabase/queries';
import{apiError,jsonBody,privateHeaders,sameOrigin}from'@/lib/supabase/api';
import{exactKeys,MutationError,mutationFailure,uuid,textField}from'@/lib/supabase/mutations';
import{mediaPath}from'@/lib/supabase/media';
export const dynamic='force-dynamic';
export async function GET(request:Request){try{const c=await createClient();if(!c)throw new MutationError(503,'Fotos indisponíveis.');await requireUser(c);const q=new URL(request.url).searchParams;const kind=q.get('kind');if(kind!=='arena'&&kind!=='community')throw new MutationError(400,'Destino inválido.');const r=await c.from('entity_media_assets').select('path,slot,ready,deleting').eq(kind==='arena'?'arena_id':'community_id',uuid(q.get('id')));if(r.error)mutationFailure(r.error);return Response.json({data:r.data},{headers:privateHeaders});}catch(e){return apiError(e)}}
export async function POST(request:Request){try{sameOrigin(request);const b=await jsonBody(request);exactKeys(b,['kind','id','slot','path']);const c=await createClient();if(!c)throw new MutationError(503,'Fotos indisponíveis.');await requireUser(c);const r=await c.rpc('set_entity_photo',{p_kind:textField(b.kind,5,9),p_id:uuid(b.id),p_slot:textField(b.slot,5,6),p_path:b.path===null?undefined:mediaPath(b.path)});if(r.error)mutationFailure(r.error);return Response.json({data:true},{headers:privateHeaders});}catch(e){return apiError(e)}}
