import{ArenaManagement}from'@/components/pico/connected/ArenaManagement';
export default async function Page({params}:{params:Promise<{slug:string}>}){const{slug}=await params;return <ArenaManagement slug={slug}/>}
