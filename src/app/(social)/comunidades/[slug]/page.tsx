import{Community}from'@/components/pico/connected/Communities';export default async function Page({params}:{params:Promise<{slug:string}>}){return <Community slug={(await params).slug}/>}
