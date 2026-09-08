import Toveli from "../../toveli";
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;return <Toveli initialView="chat" chatId={id}/>;}
