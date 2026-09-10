export const dynamic='force-dynamic';
export function GET(){return Response.json({version:process.env.NEXT_PUBLIC_PICO_VERSION,environment:process.env.NEXT_PUBLIC_PICO_ENV},{headers:{'Cache-Control':'no-store'}})}
