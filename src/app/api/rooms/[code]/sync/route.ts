import { NextRequest } from 'next/server';
import { lockedRoom } from '@/server/db';
import { advance, presence, project } from '@/server/engine';
import { authenticate, failure, originCheck, reply, validateCode } from '@/server/http';
export const runtime='nodejs';
export async function POST(req:NextRequest,{params}:{params:Promise<{code:string}>}){try{
  originCheck(req);const code=validateCode((await params).code);
  const view=await lockedRoom(code,async(room,now)=>{const p=authenticate(req,room);advance(room,now);presence(room,p,now);return project(room,p,now);});
  return reply({room:view});
}catch(error){return failure(error);}}
