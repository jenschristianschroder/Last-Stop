import { randomInt, randomUUID } from 'node:crypto';
import { CHARACTERS, CARRIAGES, EMPTY_BALLOT, WEAPONS, character } from '../lib/catalog';
import type { Action, Ballot, Carriage, Command, Interference, LogEvent, Message, Phase, RoomView } from '../lib/types';
import { CASE_VERSION, DOSSIERS, LEADS, REPORTS, REVELATION, TRUTH, evidence } from './case';

export class GameError extends Error { constructor(message:string,public status=400){super(message);} }
export type Player = {
  id:string;name:string;tokenHash:string;characterId:string|null;ready:boolean;approved:boolean;bot:boolean;
  lastSeen:number;inventory:string[];actions:Record<string,Action>;personalDone:boolean;
  botPlan?:Action;botAt?:number;location?:Carriage;moveReadyAt?:number;search?:{target:string;readyAt:number;round:number}|null;
  note:string;notebook:Record<string,boolean>;ballot:Ballot;rates:Record<string,number[]>;
};
export type Room = {
  code:string;version:number;caseVersion:string;phase:Phase;round:number;deadline:number|null;
  createdAt:number;preset:'voice'|'text';practice:boolean;hostId:string;players:Player[];
  leads:Record<string,{progress:number;jammed:boolean;contributors:string[]}>;
  published:string[];tested:string[];plantedReport:string|null;tokens:number;
  interference:Record<string,Interference>;events:LogEvent[];messages:Message[];
  receipts:Record<string,number>;incomplete:boolean;pauseUsed:boolean;pausedUntil:number|null;
};
const ACTIVE:Phase[]=['briefing','plan','read','discuss','final','vote'];
export function newPlayer(name:string,tokenHash:string,now:number,bot=false):Player {
  return {id:randomUUID(),name,tokenHash,characterId:null,ready:bot,approved:bot,bot,lastSeen:now,inventory:[],actions:{},personalDone:false,location:'lounge',moveReadyAt:0,search:null,note:'',notebook:{},ballot:{...EMPTY_BALLOT},rates:{}};
}
export function createRoom(code:string,name:string,tokenHash:string,now:number,practice=false):Room {
  const host=newPlayer(name,tokenHash,now);host.approved=true;
  const room:Room={code,version:1,caseVersion:CASE_VERSION,phase:'lobby',round:0,deadline:null,createdAt:now,preset:'voice',practice,hostId:host.id,players:[host],leads:Object.fromEntries(LEADS.map(l=>[l.id,{progress:0,jammed:false,contributors:[]}])) ,published:[],tested:[],plantedReport:null,tokens:2,interference:{},events:[],messages:[],receipts:{},incomplete:false,pauseUsed:false,pausedUntil:null};
  if(practice) for(const name of ['Robin','Alex','Sam','Jules','Morgan'])room.players.push(newPlayer(name,'bot-'+randomUUID(),now,true));
  addEvent(room,'The night train is waiting. Six passengers. One secret.','story');return room;
}
export function addEvent(room:Room,text:string,type:LogEvent['type']='system') {room.events.push({id:randomUUID(),text,round:room.round,type});room.events=room.events.slice(-80);}
export function role(p:Player){return p.characterId===TRUTH.killer?'killer':'investigator';}
export function requiredVotes(room:Room){return Math.floor(room.players.filter(p=>role(p)==='investigator').length/2)+1;}
export function result(room:Room) {const correct=room.players.filter(p=>role(p)==='investigator'&&p.ballot.killer===TRUTH.killer).length;return {correct,required:requiredVotes(room),winner:correct>=requiredVotes(room)?'investigators' as const:'killer' as const};}
function duration(room:Room,phase:Phase){return (phase==='briefing'?60:phase==='plan'?(room.preset==='text'?90:60):phase==='read'?(room.preset==='text'?30:15):phase==='discuss'?(room.preset==='text'?90:60):phase==='final'?60:phase==='vote'?30:0)*1000;}
function enter(room:Room,phase:Phase,at:number){room.phase=phase;room.deadline=phase==='lobby'||phase==='reveal'?null:at+duration(room,phase);room.version++;if(phase==='plan'){const reserved:Record<string,number>={};for(const p of room.players.filter(x=>x.bot)){p.botPlan=fallback(room,p,reserved);p.botAt=at+((LEADS.find(l=>l.id===p.botPlan?.target)?.location||REPORTS.find(t=>t.id===p.botPlan?.target)?.location)===(p.location||'lounge')?4000:2000);if(p.botPlan.target)reserved[p.botPlan.target]=(reserved[p.botPlan.target]||0)+1;}}}
function start(room:Room,now:number){
  if(room.players.length!==6||room.players.some(p=>!p.ready||!p.approved))throw new GameError('All six passengers must be approved and ready.');
  const ids:string[]=CHARACTERS.map(c=>c.id);
  for(let i=ids.length-1;i>0;i--){const j=randomInt(i+1);[ids[i],ids[j]]=[ids[j],ids[i]];}
  room.players.forEach((p,i)=>{p.characterId=ids[i];p.lastSeen=now;});
  addEvent(room,'21:15. Victor Ash is found in the vestibule. The attack happened elsewhere, between 21:10 and 21:12.','story');enter(room,'briefing',now);
}
function leadCost(room:Room,id:string){return LEADS.find(l=>l.id===id)!.cost+(room.leads[id].jammed?1:0);}
function validAction(room:Room,p:Player,a:Action):boolean {
  if(a.type==='pass')return true;
  if(a.type==='secret')return !p.personalDone;
  if(a.type==='test')return REPORTS.some((t,i)=>t.id===a.target&&(i+1<room.round||(t.id==='T5'&&room.round===5)))&&!room.tested.includes(a.target!);
  const lead=LEADS.find(l=>l.id===a.target);
  if(!lead||lead.unlock>room.round)return false;
  const complete=room.leads[lead.id].progress>=leadCost(room,lead.id);
  if(a.type==='investigate')return !complete;
  return a.type==='retrieve'&&complete&&!room.published.includes(lead.id)&&!p.inventory.includes(lead.id);
}
function fallback(room:Room,p:Player,reserved:Record<string,number>):Action {
  const lead=LEADS.find(l=>l.unlock<=room.round&&room.leads[l.id].progress+(reserved[l.id]||0)<leadCost(room,l.id));
  if(lead)return {type:'investigate',target:lead.id};
  const trace=REPORTS.find((t,i)=>(i+1<room.round||(t.id==='T5'&&room.round===5))&&!room.tested.includes(t.id)&&!reserved[t.id]);
  if(trace)return {type:'test',target:trace.id};
  const complete=LEADS.find(l=>l.unlock<=room.round&&room.leads[l.id].progress>=leadCost(room,l.id)&&!room.published.includes(l.id)&&!p.inventory.includes(l.id));
  return complete?{type:'retrieve',target:complete.id}:{type:'pass'};
}
function walkBots(room:Room,now:number){
  if(room.phase!=='plan')return;
  for(const p of room.players.filter(x=>x.bot)){
    let steps=0;
    while(p.botPlan&&p.botAt!==undefined&&p.botAt<=now&&steps++<6){
      const action=p.botPlan;
      const destination=LEADS.find(l=>l.id===action.target)?.location||REPORTS.find(t=>t.id===action.target)?.location;
      if(destination&&destination!==(p.location||'lounge')){
        const from=CARRIAGES.findIndex(c=>c.id===(p.location||'lounge')),to=CARRIAGES.findIndex(c=>c.id===destination);
        p.location=CARRIAGES[from+Math.sign(to-from)].id;p.botAt+=2000;
        if(p.location===destination)p.botAt+=4000;
      }else{p.actions[room.round]=action;p.botPlan=undefined;}
      room.version++;
    }
  }
}
function resolveRound(room:Room){
  const actions=new Map<string,Action>(),reserved:Record<string,number>={};
  const reserve=(a:Action)=>{if(a.target)reserved[a.target]=(reserved[a.target]||0)+1;};
  for(const p of room.players){const a=p.actions[room.round];if(a&&validAction(room,p,a)){actions.set(p.id,a);reserve(a);}}
  const ordered=[...room.players.slice(room.round%6),...room.players.slice(0,room.round%6)];
  for(const p of ordered)if(!actions.has(p.id)){const a:Action={type:'pass'};actions.set(p.id,a);reserve(a);p.actions[room.round]=a;}
  const killer=room.players.find(p=>role(p)==='killer')!;
  if(killer.bot&&room.tokens>0&&(room.round===1||room.round===4)){
    const target=LEADS.find(l=>l.unlock<=room.round&&l.location===(killer.location||'lounge')&&!room.leads[l.id].jammed&&room.leads[l.id].progress<leadCost(room,l.id));
    if(target)room.interference[room.round]={type:'jam',target:target.id};
  }
  const sabotage=room.interference[room.round];
  if(sabotage&&room.tokens>0&&room.round<=4){
    if(sabotage.type==='jam'){
      const l=LEADS.find(l=>l.id===sabotage.target);
      if(l&&l.unlock<=room.round&&!room.leads[l.id].jammed&&room.leads[l.id].progress<leadCost(room,l.id)){
        room.leads[l.id].jammed=true;room.tokens--;addEvent(room,'A record has been misplaced. '+l.title+' needs one extra unit of work.','sabotage');
      }
    }else if(sabotage.type==='plant'&&!room.plantedReport&&REPORTS[room.round-1]?.planted){room.plantedReport=REPORTS[room.round-1].id;room.tokens--;}
  }
  for(const p of room.players){
    const a=actions.get(p.id)!;
    if(a.type==='investigate'){
      const l=room.leads[a.target!];l.progress=Math.min(leadCost(room,a.target!),l.progress+1);if(!l.contributors.includes(p.id))l.contributors.push(p.id);
    }else if(a.type==='test'&&!room.tested.includes(a.target!)){
      room.tested.push(a.target!);room.published.push(a.target!+'-test');addEvent(room,'A report has been checked: '+REPORTS.find(t=>t.id===a.target)!.title+'.','discovery');
    }else if(a.type==='retrieve'){if(!p.inventory.includes(a.target!))p.inventory.push(a.target!);}
    else if(a.type==='secret'){p.personalDone=true;}
  }
  for(const l of LEADS){const state=room.leads[l.id];if(state.progress>=leadCost(room,l.id))for(const id of state.contributors){const p=room.players.find(p=>p.id===id)!;if(!p.inventory.includes(l.id)){p.inventory.push(l.id);}}}
  for(const p of room.players.filter(p=>p.bot&&role(p)==='investigator'))for(const id of p.inventory)if(!room.published.includes(id)){room.published.push(id);addEvent(room,character(p.characterId)!.name+' shared “'+evidence(id)!.title+'”.','discovery');}
  addEvent(room,'A new report arrives: '+REPORTS[room.round-1].title+'. It is untested.','story');
  if(room.practice){const p=room.players.find(p=>p.bot&&role(p)==='investigator')!;room.messages.push({id:randomUUID(),playerId:p.id,name:character(p.characterId)!.name,text:['We should compare what we find. A story is not the same as evidence.','The body was moved. The vestibule is not one of the possible crime scenes.','An access record only matters once we establish the scene.','Check both the weapon and the access records before settling on a suspect.','The final accusation is private. Make sure your killer selection is saved.'][room.round-1],at:Date.now()});}
}
export function candidateKillers(room:Room,p:Player):string[]{
  const facts=new Set([...room.published,...p.inventory].map(id=>LEADS.find(l=>l.id===id)?.fact).filter(Boolean));
  const possible=new Set<string>();
  for(const suspect of CHARACTERS)for(const weapon of WEAPONS)for(const scene of CARRIAGES){
    if(role(p)==='investigator'&&suspect.id===p.characterId)continue;
    if(facts.has('F1')&&!['sleeper','luggage'].includes(scene.id))continue;
    if(facts.has('F2')&&!['sleeper','lounge'].includes(scene.id))continue;
    if(facts.has('F3')&&!['brass signal bell','steel spanner'].includes(weapon))continue;
    if(facts.has('F4')&&!['brass signal bell','brass paperweight'].includes(weapon))continue;
    if(facts.has('F5')&&scene.id==='sleeper'&&!['ada','cora','eli'].includes(suspect.id))continue;
    if(facts.has('F6')&&weapon==='brass signal bell'&&!['ben','cora','daan'].includes(suspect.id))continue;
    possible.add(suspect.id);
  }
  return [...possible];
}
function botBallots(room:Room){for(const p of room.players.filter(p=>p.bot)){
  const choices=candidateKillers(room,p);const facts=new Set([...room.published,...p.inventory].map(id=>LEADS.find(l=>l.id===id)?.fact));
  p.ballot={killer:role(p)==='killer'?'ben':choices[0]||'',weapon:facts.has('F3')&&facts.has('F4')?'brass signal bell':'',scene:facts.has('F1')&&facts.has('F2')?'sleeper':''};
}}
export function advance(room:Room,now:number){
  if(!ACTIVE.includes(room.phase))return;
  if(room.pausedUntil&&now<room.pausedUntil)return;
  if(room.pausedUntil)room.pausedUntil=null;
  walkBots(room,Math.min(now,room.deadline||now));
  // Long gaps are reconciled against the stored schedule, never now + duration.
  let loops=0;
  while(room.deadline!==null&&now>=room.deadline&&loops++<25){
    const at=room.deadline;walkBots(room,at);
    if(room.phase==='briefing'){room.round=1;enter(room,'plan',at);}
    else if(room.phase==='plan'){resolveRound(room);enter(room,'read',at);}
    else if(room.phase==='read'){enter(room,'discuss',at);}
    else if(room.phase==='discuss'){
      const roundLength=duration(room,'plan')+duration(room,'read')+duration(room,'discuss');
      if(room.players.some(p=>!p.bot&&p.lastSeen<at-roundLength))room.incomplete=true;
      if(room.round===5)enter(room,'final',at);else {room.round++;enter(room,'plan',at);}
    }else if(room.phase==='final'){enter(room,'vote',at);}
    else if(room.phase==='vote'){
      if(room.players.some(p=>!p.bot&&p.lastSeen<at-duration(room,'vote')))room.incomplete=true;
      botBallots(room);enter(room,'reveal',at);addEvent(room,'The train reaches its last stop. The truth can finally be told.','story');
    }else break;
  }
}
export function presence(room:Room,p:Player,now:number){
  // A request first reconciles past deadlines; a late reconnect cannot reopen them.
  if(!room.practice&&!room.pauseUsed&&ACTIVE.includes(room.phase)&&room.deadline!==null&&room.deadline>now&&room.players.some(x=>!x.bot&&now-x.lastSeen>10000)){
    room.pauseUsed=true;room.pausedUntil=now+60000;room.deadline+=60000;for(const bot of room.players)if(bot.botAt)bot.botAt+=60000;room.version++;
    addEvent(room,'A passenger lost their connection. The train waits for one minute.');
  }
  p.lastSeen=now;
}
function rate(p:Player,key:string,now:number,limit:number,window:number){const recent=(p.rates[key]||[]).filter(t=>now-t<window);if(recent.length>=limit)throw new GameError('A moment, please. Try again shortly.',429);p.rates[key]=[...recent,now];}
function host(room:Room,p:Player){if(p.id!==room.hostId)throw new GameError('Only the host can do that.',403);}
export function apply(room:Room,p:Player,command:Command,now:number){
  if(command.type==='ready'){if(room.phase!=='lobby')throw new GameError('The train has departed.');p.ready=command.ready;}
  else if(command.type==='approve'||command.type==='remove'){
    host(room,p);if(room.phase!=='lobby')throw new GameError('The passenger list is fixed after departure.');
    const target=room.players.find(x=>x.id===command.playerId);if(!target||target.id===p.id)throw new GameError('Passenger unavailable.');
    if(command.type==='approve')target.approved=true;else room.players=room.players.filter(x=>x.id!==target.id);
  }else if(command.type==='preset'){host(room,p);if(room.phase!=='lobby')throw new GameError('Pacing is fixed after departure.');if(!['voice','text'].includes(command.preset))throw new GameError('Unknown pacing.');room.preset=command.preset;}
  else if(command.type==='start'){host(room,p);if(room.phase!=='lobby')throw new GameError('The train has already departed.');start(room,now);}
  else if(command.type==='advance'){
    host(room,p);if(!room.practice||room.deadline===null)throw new GameError('Skipping time is only available in rehearsal.');room.deadline=now;advance(room,now);
  }else if(command.type==='delete'){host(room,p);}
  else if(command.type==='move'||command.type==='search'){
    if(!p.approved||room.phase!=='plan'||command.round!==room.round||now>=room.deadline!)throw new GameError('This investigation window has closed.');
    if(room.pausedUntil&&now<room.pausedUntil)throw new GameError('The game is paused for a connection.');
    if(now<(p.moveReadyAt||0))throw new GameError('You are still crossing between carriages.');
    if(command.type==='move'){
      const from=CARRIAGES.findIndex(c=>c.id===(p.location||'lounge')),to=CARRIAGES.findIndex(c=>c.id===command.location);
      if(to<0||Math.abs(to-from)!==1)throw new GameError('Walk through the adjoining carriage first.');
      p.location=command.location;p.moveReadyAt=now+2000;p.search=null;
    }else{
      const lead=LEADS.find(l=>l.id===command.target);
      if(!lead||!validAction(room,p,{type:'investigate',target:lead.id}))throw new GameError('That search is not available.');
      if(lead.location!==(p.location||'lounge'))throw new GameError('Travel to the object’s carriage first.');
      if(p.search?.target!==lead.id||p.search.round!==room.round)p.search={target:lead.id,readyAt:now+4000,round:room.round};
    }
  }else if(command.type==='action'){
    if(!p.approved||room.phase!=='plan'||command.round!==room.round)throw new GameError('This investigation window has closed.');
    if(room.pausedUntil&&now<room.pausedUntil)throw new GameError('The game is paused for a connection.');
    rate(p,'draft',now,3,1000);if(!validAction(room,p,command.action))throw new GameError('That action is no longer available.');const destination=LEADS.find(l=>l.id===command.action.target)?.location||REPORTS.find(t=>t.id===command.action.target)?.location;
    if(destination&&destination!==(p.location||'lounge'))throw new GameError('Travel to the evidence’s carriage first.');
    if(now<(p.moveReadyAt||0))throw new GameError('Finish crossing before investigating.');
    if(command.action.type==='investigate'&&(!p.search||p.search.target!==command.action.target||p.search.round!==room.round||now<p.search.readyAt))throw new GameError('Search the object before committing your fieldwork.');
    p.actions[room.round]=command.action;
  }else if(command.type==='interference'){
    if(role(p)!=='killer'||!p.approved)throw new GameError('That action is not available to you.',403);
    if(room.pausedUntil&&now<room.pausedUntil)throw new GameError('The game is paused for a connection.');
    if(room.phase!=='plan'||room.round!==command.round||room.round>4||room.tokens<=0)throw new GameError('Interference is unavailable.');
    const a=command.interference;
    if(a?.type==='jam'){const l=LEADS.find(l=>l.id===a.target);if(!l||l.unlock>room.round||l.location!==(p.location||'lounge')||now<(p.moveReadyAt||0)||room.leads[l.id].jammed||room.leads[l.id].progress>=leadCost(room,l.id))throw new GameError('Choose an unfinished, unobstructed lead.');}
    else if(a?.type==='plant'){if(room.plantedReport)throw new GameError('You have already planted a report.');}
    else if(a!==null)throw new GameError('Unknown interference.');
    if(a)room.interference[room.round]=a;else delete room.interference[room.round];
  }else if(command.type==='publish'||command.type==='publishAll'){
    if(room.phase==='lobby'||room.phase==='briefing'||room.phase==='vote'||room.phase==='reveal')throw new GameError('Evidence cannot be published in this phase.');
    const ids=command.type==='publish'?[command.evidenceId]:p.inventory;
    for(const id of ids){if(!p.inventory.includes(id))throw new GameError('You have not acquired this evidence.',403);}
    for(const id of ids)if(!room.published.includes(id)){room.published.push(id);addEvent(room,character(p.characterId)!.name+' shared “'+evidence(id)!.title+'”.','discovery');}
  }else if(command.type==='ballot'){
    if(room.phase!=='vote'||!p.approved)throw new GameError('The ballot is not open.');
    const b=command.ballot;if(!b||![...CHARACTERS.map(c=>c.id),''].includes(b.killer)||![...WEAPONS,''].includes(b.weapon)||![...CARRIAGES.map(c=>c.id),''].includes(b.scene))throw new GameError('Invalid accusation.');p.ballot={killer:b.killer,weapon:b.weapon,scene:b.scene};
  }else if(command.type==='note'){
    if(typeof command.note!=='string'||command.note.length>3000||!command.notebook||Object.keys(command.notebook).length>30)throw new GameError('Keep notes under 3,000 characters.');
    p.note=command.note;p.notebook=Object.fromEntries(Object.entries(command.notebook).filter(([k,v])=>typeof v==='boolean'&&/^[\w -]{1,40}$/.test(k)));
  }else if(command.type==='message'){
    if(!p.approved)throw new GameError('Wait for the host to let you aboard.',403);
    if(room.phase==='vote')throw new GameError('The final ballot is private. Discussion has ended.');
    if(typeof command.text!=='string'||!command.text.trim()||command.text.length>500)throw new GameError('Messages must be 1–500 characters.');
    rate(p,'chat',now,5,10000);room.messages.push({id:randomUUID(),playerId:p.id,name:character(p.characterId)?.name||p.name,text:command.text.trim(),at:now});room.messages=room.messages.slice(-80);
  }else throw new GameError('Unknown command.');
  room.version++;
}
export function project(room:Room,p:Player,now:number):RoomView {
  const d=p.characterId?DOSSIERS[p.characterId]:null;
  const known=p.inventory.map(evidence).filter((x):x is NonNullable<typeof x>=>!!x);
  const reports=REPORTS.filter((t,i)=>i+1<room.round||(i+1===room.round&&(!['plan','briefing','lobby'].includes(room.phase)||t.id==='T5'))).map((t,i)=>({id:t.id,title:t.title,kind:'untested' as const,location:t.location,text:room.plantedReport===t.id?t.planted!:t.ordinary,round:i+1}));
  return {code:room.code,version:room.version,phase:room.phase,round:room.round,deadline:room.deadline,serverNow:now,preset:room.preset,practice:room.practice,hostId:room.hostId,pausedUntil:room.pausedUntil,pauseUsed:room.pauseUsed,incomplete:room.incomplete,
    players:room.players.map(x=>({id:x.id,name:x.name,characterId:x.characterId,ready:x.ready,approved:x.approved,bot:x.bot,connected:x.bot||now-x.lastSeen<15000,host:x.id===room.hostId,location:x.id===p.id||(x.location||'lounge')===(p.location||'lounge')?(x.location||'lounge'):null,...(room.phase==='reveal'?{role:role(x)}:{})})),
    leads:LEADS.map(l=>({id:l.id,title:l.title,description:l.description,location:l.location,cost:leadCost(room,l.id),unlock:l.unlock,progress:room.leads[l.id].progress,reserved:room.phase==='plan'?room.players.filter(x=>x.actions[room.round]?.type==='investigate'&&x.actions[room.round]?.target===l.id).length:0,jammed:room.leads[l.id].jammed,complete:room.leads[l.id].progress>=leadCost(room,l.id),owned:p.inventory.includes(l.id),published:room.published.includes(l.id)})),
    board:room.published.map(evidence).filter((x):x is NonNullable<typeof x>=>!!x),reports,tested:room.tested,events:room.events.slice(-20),messages:room.messages,
    me:{location:p.location||'lounge',moveReadyAt:p.moveReadyAt||0,search:p.search?.round===room.round?p.search:null,id:p.id,name:p.name,approved:p.approved,ready:p.ready,characterId:p.characterId,role:p.characterId?role(p):null,account:d?.account||'',secret:d?.secret||'',objective:d?.objective||'',inventory:known,action:p.actions[room.round]||null,interference:role(p)==='killer'?room.interference[room.round]||null:null,tokens:p.characterId&&role(p)==='killer'?room.tokens:null,planted:role(p)==='killer'?!!room.plantedReport:false,personalDone:p.personalDone,note:p.note,notebook:p.notebook,ballot:p.ballot},
    reveal:room.phase==='reveal'?{...TRUTH,...REVELATION,...result(room),ballots:room.players.map(x=>({name:x.name,characterId:x.characterId!,role:role(x),ballot:x.ballot,reconstruction:role(x)==='investigator'&&x.ballot.killer===TRUTH.killer&&x.ballot.weapon===TRUTH.weapon&&x.ballot.scene===TRUTH.scene}))}:null};
}
