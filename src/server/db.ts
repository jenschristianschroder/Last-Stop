import { Pool, type PoolClient } from 'pg';
import { attachDatabasePool } from '@vercel/functions';
import { GameError, type Room } from './engine';
const globalDb=globalThis as typeof globalThis & { lastStopPool?: Pool };
function pool(){
  if(!process.env.DATABASE_URL)throw new GameError('The railway is not connected yet. Please try again shortly.',503);
  if(!globalDb.lastStopPool){globalDb.lastStopPool=new Pool({connectionString:process.env.DATABASE_URL,max:5,idleTimeoutMillis:10000,connectionTimeoutMillis:10000});attachDatabasePool(globalDb.lastStopPool);}
  return globalDb.lastStopPool;
}
export async function transaction<T>(fn:(client:PoolClient)=>Promise<T>):Promise<T>{
  const client=await pool().connect();
  try {await client.query('BEGIN');await client.query("SET LOCAL lock_timeout='5s'");const result=await fn(client);await client.query('COMMIT');return result;}
  catch(error){await client.query('ROLLBACK');throw error;}
  finally {client.release();}
}
export async function lockedRoom<T>(code:string,fn:(room:Room,now:number,client:PoolClient)=>Promise<T>):Promise<T>{
  return transaction(async client=>{
    const r=await client.query('SELECT state FROM last_stop_rooms WHERE code=$1 AND expires_at>clock_timestamp() FOR UPDATE',[code]);
    if(!r.rows.length)throw new GameError('That train could not be found. Check the code or ask for a new invitation.',404);
    const clock=await client.query('SELECT EXTRACT(EPOCH FROM clock_timestamp())*1000 AS now');
    const room=r.rows[0].state as Room;const result=await fn(room,Number(clock.rows[0].now),client);
    await client.query('UPDATE last_stop_rooms SET state=$2::jsonb WHERE code=$1',[code,JSON.stringify(room)]);
    return result;
  });
}
export async function limit(client:PoolClient,key:string,max:number,seconds:number){
  const r=await client.query(`INSERT INTO last_stop_limits(key,hits) VALUES($1,1)
    ON CONFLICT(key) DO UPDATE SET hits=CASE WHEN last_stop_limits.window_start<clock_timestamp()-$2*interval '1 second' THEN 1 ELSE last_stop_limits.hits+1 END,
    window_start=CASE WHEN last_stop_limits.window_start<clock_timestamp()-$2*interval '1 second' THEN clock_timestamp() ELSE last_stop_limits.window_start END RETURNING hits`,[key,seconds]);
  if(r.rows[0].hits>max)throw new GameError('Too many boarding attempts. Please wait a moment.',429);
}
