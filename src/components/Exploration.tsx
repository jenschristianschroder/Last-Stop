'use client';
import { CARRIAGES, character } from '@/lib/catalog';
import type { Command, RoomView } from '@/lib/types';
const OBJECTS:Record<string,string>={E1:'Coat on the seat',E2:'Door seal panel',E3:'Tool cabinet',E4:'Sample tray',E5a:'Compartment lock',E6a:'Service register',E5b:'Conductor’s desk',E6b:'Station mailbag'};
export default function Exploration({room,now,busy,send,inspect}:{room:RoomView;now:number;busy:boolean;send:(c:Command,feedback?:string)=>Promise<void>;inspect:()=>void}){
  const index=CARRIAGES.findIndex(c=>c.id===room.me.location);
  const moving=now<room.me.moveReadyAt;
  const enabled=room.phase==='plan'&&!busy&&!moving&&!(room.pausedUntil&&room.pausedUntil>now);
  const nearby=room.players.filter(p=>p.location===room.me.location);
  return <section className="exploration" aria-label="Explore the train">
    <div className="exploration-heading"><h2>Walk the train</h2><span>{moving?'Crossing the gangway…':`You are in ${CARRIAGES[index].name.toLowerCase()}`}</span></div>
    <p>Walk to an adjoining car, search an object, then commit one fieldwork action before the bell. Travel is free. A new commitment replaces your previous one.</p>
    <nav className="exploration-map" aria-label="Train carriages">{CARRIAGES.map((c,i)=><button key={c.id} aria-current={i===index?'location':undefined} disabled={!enabled||Math.abs(i-index)!==1} onClick={()=>send({type:'move',location:c.id,round:room.round})}><small>CAR {c.number}</small><strong>{c.name}</strong><span>{i===index?'● YOU':Math.abs(i-index)===1?'Walk here →':'Through adjoining car'}</span></button>)}</nav>
    <div className="exploration-room"><div className="exploration-people" aria-label="Passengers in your carriage">{nearby.map(p=><span key={p.id}><i style={{background:character(p.characterId)?.color}}/>{p.id===room.me.id?'You':character(p.characterId)?.name}{p.bot?' · bot':''}</span>)}</div>
    <p className="small-muted">You can see passengers in this car only. These are present-day movements, not alibis for the earlier murder.</p>
    <div className="exploration-objects">{room.leads.filter(l=>l.location===room.me.location).map(l=>{
      const searching=room.me.search?.target===l.id;const seconds=searching?Math.max(0,Math.ceil((room.me.search!.readyAt-now)/1000)):0;
      const committed=room.me.action?.target===l.id;
      return <article key={l.id}><small>{l.id} · {l.progress}/{l.cost} work{l.reserved?` · ${l.reserved} helping`:''}</small><h3>{OBJECTS[l.id]}</h3><p>{l.description}</p>{l.unlock>room.round?<span>Available in round {l.unlock}</span>:l.complete?<button onClick={inspect}>Inspect completed finding</button>:<button disabled={!enabled||!!(searching&&seconds>0)||committed} onClick={()=>searching?send({type:'action',round:room.round,action:{type:'investigate',target:l.id}},'Fieldwork saved for the bell. You may keep exploring.'):send({type:'search',round:room.round,target:l.id})}>{committed?'✓ Fieldwork committed':searching?(seconds?`Searching… ${seconds}s`:'Commit this fieldwork'):'Search object · 4 sec'}</button>}</article>;
    })}</div><button className="text-link" onClick={inspect}>Inspect records and speak to witnesses in this car →</button></div>
    <p className="small-muted">{room.phase==='plan'?'Split up to cover ground, or meet here to finish a difficult clue together. Leaving cancels an unfinished search. Completed fieldwork stays saved.':'Exploration resumes next investigation round. Compare your findings now.'}</p>
  </section>;
}
