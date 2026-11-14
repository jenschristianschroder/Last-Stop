import { randomInt } from 'node:crypto';
import { NextRequest } from 'next/server';
import { transaction, limit } from '@/server/db';
import { createRoom, project } from '@/server/engine';
import { body, failure, hash, networkKey, nonce, originCheck, playerName, reply, secretToken, session } from '@/server/http';
export const runtime='nodejs';
export async function POST(req:NextRequest){try{
  originCheck(req);const input=await body(req);const key=nonce(input.requestId);const name=playerName(input.name);const token=secretToken(key);
  const room=await transaction(async client=>{
    const existing=await client.query('SELECT state FROM last_stop_rooms WHERE creation_key=$1 AND expires_at>clock_timestamp()',[hash(key)]);if(existing.rows.length)return existing.rows[0].state;
    await limit(client,'create:'+networkKey(req),10,3600);
    await client.query('DELETE FROM last_stop_rooms WHERE expires_at<clock_timestamp()');
    await client.query("DELETE FROM last_stop_limits WHERE window_start<clock_timestamp()-interval '1 day'");
    const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';const code=Array.from({length:6},()=>alphabet[randomInt(alphabet.length)]).join('');
    const room=createRoom(code,name,hash(token),Date.now(),input.practice===true);
    const r=await client.query('INSERT INTO last_stop_rooms(code,creation_key,state) VALUES($1,$2,$3::jsonb) ON CONFLICT(creation_key) DO UPDATE SET creation_key=EXCLUDED.creation_key RETURNING state',[code,hash(key),JSON.stringify(room)]);
    return r.rows[0].state;
  });return session(reply({room:project(room,room.players[0],Date.now())},201),room.code,token);
}catch(error){return failure(error);}}
