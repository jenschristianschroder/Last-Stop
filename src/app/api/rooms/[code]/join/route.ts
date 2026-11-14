import { NextRequest } from 'next/server';
import { lockedRoom, limit } from '@/server/db';
import { GameError, newPlayer, project } from '@/server/engine';
import { body, failure, hash, networkKey, nonce, originCheck, playerName, reply, secretToken, session, validateCode } from '@/server/http';
export const runtime='nodejs';
export async function POST(req:NextRequest,{params}:{params:Promise<{code:string}>}){try{
  originCheck(req);const code=validateCode((await params).code);const input=await body(req);const name=playerName(input.name);const requestId=nonce(input.requestId);
  const token=req.cookies.get('ls-'+code)?.value||secretToken(code+requestId);
  const view=await lockedRoom(code,async(room,now,client)=>{
    await limit(client,'join:'+networkKey(req),30,60);
    let p=room.players.find(p=>p.tokenHash===hash(token)&&!p.bot);
    if(!p){if(room.phase!=='lobby')throw new GameError('This train has departed. Ask the host for the next game.');if(room.practice)throw new GameError('Rehearsals are private. Create a friends’ table instead.');if(room.players.length>=6)throw new GameError('All six seats are taken.');p=newPlayer(name,hash(token),now);room.players.push(p);room.version++;}
    p.lastSeen=now;return project(room,p,now);
  });return session(reply({room:view}),code,token);
}catch(error){return failure(error);}}
