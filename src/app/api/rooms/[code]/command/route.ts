import { NextRequest } from 'next/server';
import { lockedRoom } from '@/server/db';
import { advance, apply, GameError, presence, project } from '@/server/engine';
import { authenticate, body, failure, nonce, originCheck, reply, validateCode } from '@/server/http';
import type { Command } from '@/lib/types';
export const runtime='nodejs';
export async function POST(req:NextRequest,{params}:{params:Promise<{code:string}>}){try{
  originCheck(req);const code=validateCode((await params).code);const input=await body(req);const key=nonce(input.requestId);
  const result=await lockedRoom(code,async(room,now,client)=>{
    const p=authenticate(req,room);advance(room,now);presence(room,p,now);
    if(!input.command||typeof input.command.type!=='string')throw new GameError('Missing command.');
    const receipt=p.id+':'+key;
    if(!room.receipts[receipt]){
      const checkpoint=structuredClone(room);
      try {apply(room,p,input.command as Command,now);}catch(error){Object.assign(room,checkpoint);return {error:error instanceof GameError?error.message:'That action could not be saved.',status:error instanceof GameError?error.status:400,room:project(room,room.players.find(x=>x.id===p.id)!,now)};}
      room.receipts[receipt]=now;room.receipts=Object.fromEntries(Object.entries(room.receipts).sort((a,b)=>b[1]-a[1]).slice(0,500));
    }
    if(input.command.type==='delete'){await client.query('UPDATE last_stop_rooms SET expires_at=clock_timestamp() WHERE code=$1',[code]);return {deleted:true};}
    return {room:project(room,p,now)};
  });return reply(result,'status' in result?Number(result.status):200);
}catch(error){return failure(error);}}
