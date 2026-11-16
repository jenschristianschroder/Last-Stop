import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CHARACTERS, WEAPONS, CARRIAGES } from '../src/lib/catalog';
import { advance, apply, candidateKillers, createRoom, GameError, newPlayer, presence, project, result, role, type Room } from '../src/server/engine';
import { DOSSIERS, LEADS, REPORTS, REVELATION, TRUTH } from '../src/server/case';
// Existing deduction tests perform the new travel/search prerequisites explicitly.
function fieldwork(r:Room,p:Room['players'][number],command:Extract<import('../src/lib/types').Command,{type:'action'}>,at:number){
  const target=LEADS.find(l=>l.id===command.action.target)||REPORTS.find(l=>l.id===command.action.target);
  let time=at-12000;
  if(target){
    while((p.location||'lounge')!==target.location){const from=CARRIAGES.findIndex(c=>c.id===(p.location||'lounge')),to=CARRIAGES.findIndex(c=>c.id===target.location);apply(r,p,{type:'move',location:CARRIAGES[from+Math.sign(to-from)].id,round:r.round},time);time+=2000;}
    if(command.action.type==='investigate')apply(r,p,{type:'search',target:target.id,round:r.round},Math.max(time,at-4000));
  }
  apply(r,p,command,at);
}
const NOW=1_800_000_000_000;
function table(practice=false){const room=createRoom('ABC234','Host','hash-host',NOW,practice);if(!practice)for(let i=1;i<6;i++){const p=newPlayer('Guest '+i,'hash-'+i,NOW);p.ready=true;p.approved=true;room.players.push(p);}room.players[0].ready=true;apply(room,room.players[0],{type:'start'},NOW);return room;}
function next(room:Room){const at=room.deadline!;room.players.forEach(p=>p.lastSeen=at);advance(room,at);return at;}
function toPlan(room:Room,round:number){let guard=0;while((room.phase!=='plan'||room.round!==round)&&guard++<30)next(room);assert.equal(room.phase,'plan');assert.equal(room.round,round);}

test('six players must approve and ready before departure; roster cannot change midgame',()=>{
  const r=createRoom('ABC234','Host','hash',NOW);assert.throws(()=>apply(r,r.players[0],{type:'start'},NOW),GameError);
  const full=table();assert.throws(()=>apply(full,full.players[0],{type:'remove',playerId:full.players[1].id},NOW),/fixed/);
  assert.equal(full.players.filter(p=>role(p)==='killer').length,1);assert.equal(new Set(full.players.map(p=>p.characterId)).size,6);
});
test('private projections never include other dossiers, role labels, auth hashes, or unreleased evidence',()=>{
  const r=table();for(const p of r.players){const v=project(r,p,NOW);const s=JSON.stringify(v);
    assert.ok(!s.includes('tokenHash'));assert.equal(v.players.filter(x=>x.role).length,0);assert.equal(v.reveal,null);assert.equal(v.me.tokens,role(p)==='killer'?2:null);
    for(const c of CHARACTERS)if(c.id!==p.characterId)assert.ok(!s.includes(DOSSIERS[c.id].secret));
    for(const l of LEADS)assert.ok(!s.includes(l.text));
    assert.ok(!s.includes(REVELATION.narrative));
  }
});
test('the authored implementation uses validated clue costs and unlock rounds',()=>{
  const fixture=JSON.parse(readFileSync(new URL('../docs/case.json',import.meta.url),'utf8'));
  for(const l of LEADS){const f=fixture.leads.find((x:{id:string})=>x.id===l.id);assert.equal(l.cost,f.cost);assert.equal(l.unlock,f.unlock);assert.equal(l.fact,f.fact);}
});
test('killer works and obstructs in the same round, without erasing progress',()=>{
  const r=table();toPlan(r,1);const k=r.players.find(p=>role(p)==='killer')!;const at=r.deadline!-1000;
  for(const p of r.players)apply(r,p,{type:'action',round:1,action:{type:'pass'}},at);
  fieldwork(r,k,{type:'action',round:1,action:{type:'investigate',target:'E1'}},at+100);
  apply(r,k,{type:'interference',round:1,interference:{type:'jam',target:'E1'}},at+100);next(r);
  assert.equal(r.leads.E1.progress,1);assert.equal(r.leads.E1.jammed,true);assert.equal(r.tokens,1);
  toPlan(r,2);assert.throws(()=>apply(r,k,{type:'interference',round:2,interference:{type:'jam',target:'E1'}},r.deadline!-100),/unobstructed/);
});
test('a guessed future evidence ID cannot bypass availability or acquisition',()=>{
  const r=table();toPlan(r,1);const p=r.players.find(p=>role(p)==='investigator')!;const at=r.deadline!-100;
  assert.throws(()=>apply(r,p,{type:'action',round:1,action:{type:'investigate',target:'E6a'}},at),/no longer available/);
  assert.throws(()=>apply(r,p,{type:'action',round:1,action:{type:'test',target:'T1'}},at),/no longer available/);
  assert.throws(()=>apply(r,p,{type:'publish',evidenceId:'E6a'},at),/not acquired/);
  assert.throws(()=>apply(r,p,{type:'interference',round:1,interference:{type:'plant'}},at),/not available to you/);
});
test('withdrawn reservations cannot block another player committing to the same lead',()=>{
  const r=table();toPlan(r,1);const at=r.deadline!-1000;
  for(const p of r.players)fieldwork(r,p,{type:'action',round:1,action:{type:'investigate',target:'E1'}},at);
  apply(r,r.players[0],{type:'action',round:1,action:{type:'pass'}},at+10);next(r);
  assert.equal(r.leads.E1.progress,2);for(const p of r.players.slice(1))assert.ok(p.inventory.includes('E1'));
});
test('previous contributors receive the completed card and withheld cards can be retrieved',()=>{
  const r=table();toPlan(r,1);const k=r.players.find(p=>role(p)==='killer')!,p=r.players.find(p=>role(p)==='investigator')!;
  for(const x of r.players)apply(r,x,{type:'action',round:1,action:{type:'pass'}},r.deadline!-100);
  fieldwork(r,k,{type:'action',round:1,action:{type:'investigate',target:'E1'}},r.deadline!-50);next(r);
  toPlan(r,2);for(const x of r.players)apply(r,x,{type:'action',round:2,action:{type:'pass'}},r.deadline!-100);
  fieldwork(r,k,{type:'action',round:2,action:{type:'investigate',target:'E1'}},r.deadline!-50);next(r);
  assert.ok(k.inventory.includes('E1'));assert.ok(!r.published.includes('E1'));assert.ok(!p.inventory.includes('E1'));
  toPlan(r,3);fieldwork(r,p,{type:'action',round:3,action:{type:'retrieve',target:'E1'}},r.deadline!-100);next(r);assert.ok(p.inventory.includes('E1'));
});
test('planting replaces the scheduled report without changing timing or count; a test publishes correction',()=>{
  const r=table();toPlan(r,1);const k=r.players.find(p=>role(p)==='killer')!,p=r.players.find(p=>role(p)==='investigator')!;
  assert.equal(project(r,p,NOW).reports.length,0);apply(r,k,{type:'interference',round:1,interference:{type:'plant'}},r.deadline!-50);next(r);
  const view=project(r,p,NOW);assert.equal(view.reports.length,1);assert.ok(view.reports[0].text.includes('just before'));assert.equal(view.me.planted,false);
  toPlan(r,2);fieldwork(r,p,{type:'action',round:2,action:{type:'test',target:'T1'}},r.deadline!-50);next(r);assert.ok(r.published.includes('T1-test'));assert.ok(project(r,p,NOW).board.some(e=>e.text.includes('20:40')));
});
test('no round-five interference; a stale round command cannot spend an action',()=>{
  const r=table();toPlan(r,5);const k=r.players.find(p=>role(p)==='killer')!;
  assert.throws(()=>apply(r,k,{type:'interference',round:5,interference:{type:'plant'}},r.deadline!-20),/unavailable/);
  assert.throws(()=>apply(r,k,{type:'action',round:4,action:{type:'pass'}},r.deadline!-20),/window has closed/);
});
test('the final unplantable report arrives before the last action so it can be tested',()=>{
  const r=table();toPlan(r,5);const p=r.players[0];assert.ok(project(r,p,NOW).reports.some(t=>t.id==='T5'));
  fieldwork(r,p,{type:'action',round:5,action:{type:'test',target:'T5'}},r.deadline!-50);next(r);assert.ok(r.published.includes('T5-test'));
});
test('all early certified facts leave at least two candidate killers from every innocent perspective',()=>{
  const r=table();r.published=LEADS.filter(l=>l.unlock<4).map(l=>l.id);
  for(const p of r.players.filter(p=>role(p)==='investigator'))assert.ok(candidateKillers(r,p).length>=2);
  r.published=LEADS.map(l=>l.id);for(const p of r.players.filter(p=>role(p)==='investigator'))assert.deepEqual(candidateKillers(r,p),[TRUTH.killer]);
});
test('strict-majority outcome ignores hostile cover ballots and reconstruction guesses',()=>{
  const r=table();const good=r.players.filter(p=>role(p)==='investigator'),bad=r.players.find(p=>role(p)==='killer')!;
  for(let mask=0;mask<32;mask++){for(let i=0;i<5;i++)good[i].ballot={killer:mask&(1<<i)?'cora':'',weapon:WEAPONS[mask%4],scene:CARRIAGES[mask%4].id};
    for(const killer of ['cora','ada','']){bad.ballot={killer,weapon:TRUTH.weapon,scene:TRUTH.scene};assert.equal(result(r).winner,good.filter(p=>p.ballot.killer==='cora').length>=3?'investigators':'killer');}
  }
});
test('persisted deadlines advance exactly once and do not drift with request time',()=>{
  const r=table();const first=r.deadline!;advance(r,first+1234);assert.equal(r.phase,'plan');assert.equal(r.deadline,first+60000);const version=r.version;advance(r,first+1234);assert.equal(r.version,version);
  advance(r,NOW+18*60*1000);assert.equal(r.phase,'reveal');assert.equal(r.incomplete,true);assert.equal(r.players.length,6);assert.equal(result(r).required,3);
});
test('one reconnect pause shifts the deadline once; it never removes a voter',()=>{
  const r=table();toPlan(r,1);const before=r.deadline!,at=before-15000;presence(r,r.players[0],at);assert.equal(r.pauseUsed,true);assert.equal(r.deadline,before+60000);
  presence(r,r.players[1],at+100);assert.equal(r.deadline,before+60000);assert.equal(result(r).required,3);
});
test('a complete rehearsal reaches reveal with knowledge-limited bots',()=>{
  const r=table(true);let guard=0;while(r.phase!=='reveal'&&guard++<25){const at=r.deadline!;apply(r,r.players[0],{type:'advance'},at-1);}assert.equal(r.phase,'reveal');assert.equal(project(r,r.players[0],NOW).reveal!.ballots.length,6);assert.ok(r.published.length>0);
});

test('travel enforces adjacency, crossing time, round and pause; searches require local presence and time',()=>{
  const r=table();toPlan(r,1);const p=r.players[0],at=r.deadline!-50000;
  assert.throws(()=>apply(r,p,{type:'move',location:'luggage',round:1},at),/adjoining/);
  assert.throws(()=>apply(r,p,{type:'search',target:'E3',round:1},at),/Travel/);
  apply(r,p,{type:'search',target:'E1',round:1},at);
  assert.throws(()=>apply(r,p,{type:'action',round:1,action:{type:'investigate',target:'E1'}},at+3999),/Search/);
  apply(r,p,{type:'action',round:1,action:{type:'investigate',target:'E1'}},at+4000);
  apply(r,p,{type:'move',location:'dining',round:1},at+5000);
  assert.equal(p.search,null);assert.equal(p.actions[1].target,'E1');
  assert.throws(()=>apply(r,p,{type:'move',location:'sleeper',round:1},at+5001),/crossing/);
  assert.throws(()=>apply(r,p,{type:'move',location:'sleeper',round:2},at+7000),/closed/);
  r.pausedUntil=at+20000;
  assert.throws(()=>apply(r,p,{type:'move',location:'sleeper',round:1},at+7000),/paused/);
  r.pausedUntil=null;next(r);assert.equal(r.leads.E1.progress,1);
  assert.throws(()=>apply(r,p,{type:'move',location:'sleeper',round:1},r.deadline!-100),/closed/);
});
test('only nearby passengers are located; idle humans collect no clues; sabotage requires presence',()=>{
  const r=table();toPlan(r,1);const p=r.players[0],other=r.players[1],at=r.deadline!-20000;
  apply(r,other,{type:'move',location:'dining',round:1},at);
  assert.equal(project(r,p,at).players.find(x=>x.id===other.id)!.location,null);
  assert.equal(project(r,other,at).me.location,'dining');
  const killer=r.players.find(x=>role(x)==='killer')!;
  assert.throws(()=>apply(r,killer,{type:'interference',round:1,interference:{type:'jam',target:'E3'}},at),/unobstructed/);
  next(r);assert.ok(r.players.every(x=>x.inventory.length===0));assert.equal(r.leads.E1.progress,0);
});
test('bots travel during exploration and a rehearsal still discovers the complete deduction',()=>{
  const r=table(true);toPlan(r,1);const start=r.deadline!-60000;
  advance(r,start+2000);assert.ok(r.players.some(p=>p.bot&&p.location==='dining'));
  advance(r,start+6000);assert.ok(r.players.some(p=>p.bot&&p.location==='luggage'));
  let guard=0;while(r.phase!=='reveal'&&guard++<25)next(r);
  for(const p of r.players.filter(p=>p.bot&&role(p)==='investigator'))assert.deepEqual(candidateKillers(r,p),[TRUTH.killer]);
});

test('walking is timed, bounded, interruptible and private to nearby passengers',()=>{
  const r=table();toPlan(r,1);const p=r.players[0],at=r.deadline!-40000;
  apply(r,p,{type:'walk',x:180,y:540,round:1},at);
  assert.equal(p.motion!.end,at+2000);
  assert.throws(()=>apply(r,p,{type:'search',target:'E1',round:1},at+100),/Finish walking/);
  apply(r,p,{type:'walk',x:180,y:320,round:1},at+1000);
  assert.equal(p.motion!.from.y,430);assert.equal(p.motion!.end,at+2000);
  assert.throws(()=>apply(r,p,{type:'walk',x:20,y:320,round:1},at+2100),/aisle/);
  assert.throws(()=>apply(r,p,{type:'walk',x:NaN,y:320,round:1},at+2100),/aisle/);
  const q=r.players[1];q.location='dining';assert.equal(project(r,q,at).players.find(x=>x.id===p.id)!.motion,null);
  apply(r,p,{type:'search',target:'E1',round:1},at+2200);
  apply(r,p,{type:'walk',x:180,y:400,round:1},at+2300);assert.equal(p.search,null);
  assert.throws(()=>apply(r,p,{type:'walk',x:180,y:400,round:2},at+2400),/closed/);
});
