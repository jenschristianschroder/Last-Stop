import { createHash, createHmac } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { GameError, type Player, type Room } from './engine';
export const hash=(s:string)=>createHash('sha256').update(s).digest('hex');
export function secretToken(nonce:string){if(!process.env.AUTH_SECRET)throw new GameError('Boarding is temporarily unavailable.',503);return createHmac('sha256',process.env.AUTH_SECRET).update(nonce).digest('base64url');}
export function validateCode(code:string){if(!/^[A-HJ-NP-Z2-9]{6}$/.test(code))throw new GameError('Enter the six-character invitation code.');return code;}
export function originCheck(req:NextRequest){const origin=req.headers.get('origin');if(origin&&new URL(origin).host!==req.headers.get('host'))throw new GameError('Please open the game directly to continue.',403);if(req.headers.get('sec-fetch-site')==='cross-site')throw new GameError('Cross-site request rejected.',403);}
export function authenticate(req:NextRequest,room:Room):Player{const token=req.cookies.get('ls-'+room.code)?.value;if(!token)throw new GameError('Your ticket is missing. Join this train again.',401);const p=room.players.find(p=>p.tokenHash===hash(token)&&!p.bot);if(!p)throw new GameError('Your ticket is no longer valid. Rejoin from the invitation.',401);return p;}
export function session(res:NextResponse,code:string,token:string){res.cookies.set('ls-'+code,token,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:86400});return res;}
export function reply(data:unknown,status=200){return NextResponse.json(data,{status,headers:{'Cache-Control':'no-store, private'}});}
export function failure(error:unknown){if(error instanceof GameError)return reply({error:error.message},error.status);console.error('Last Stop request failed',error instanceof Error?error.name:'UnknownError');return reply({error:'The signal dropped. Please try again; saved actions are safe.'},503);}
export async function body(req:NextRequest){if(Number(req.headers.get('content-length')||0)>16000)throw new GameError('Request too large.',413);const text=await req.text();if(text.length>16000)throw new GameError('Request too large.',413);try{return JSON.parse(text);}catch{throw new GameError('Unreadable request.');}}
export function nonce(value:unknown):string{if(typeof value!=='string'||! /^[a-f0-9-]{36}$/.test(value))throw new GameError('Missing request identifier.');return value;}
export function playerName(value:unknown):string{if(typeof value!=='string'||value.trim().length<1||value.trim().length>24)throw new GameError('Choose a name between 1 and 24 characters.');return value.trim().replace(/[\u0000-\u001f]/g,'');}
export function networkKey(req:NextRequest){return hash(req.headers.get('x-forwarded-for')?.split(',')[0]||'local');}
