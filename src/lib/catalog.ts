import type { Carriage } from './types';
export const CHARACTERS = [
  {id:'ada',name:'Ada Reed',occupation:'The travel clerk',initials:'AR',color:'#9b7d86'},
  {id:'ben',name:'Ben Ward',occupation:'The railway musician',initials:'BW',color:'#bf9c60'},
  {id:'cora',name:'Cora Vale',occupation:'The accounts officer',initials:'CV',color:'#829c92'},
  {id:'daan',name:'Daan Voss',occupation:'The mechanic',initials:'DV',color:'#a48067'},
  {id:'eli',name:'Eli March',occupation:'The courier',initials:'EM',color:'#8c9aa8'},
  {id:'freya',name:'Freya Lind',occupation:'The journalist',initials:'FL',color:'#af7f70'}
] as const;
export const CARRIAGES: {id:Carriage;name:string;number:string;description:string}[] = [
  {id:'lounge',name:'The lounge',number:'01',description:'Velvet seats. Quiet conversations. A few things left unsaid.'},
  {id:'dining',name:'The dining car',number:'02',description:'Cold coffee, polished silver, and records worth examining.'},
  {id:'sleeper',name:'The sleeper',number:'03',description:'Drawn curtains. Locked doors. Who had a key?'},
  {id:'luggage',name:'The luggage car',number:'04',description:'Travel trunks and the objects people leave behind.'}
];
export const WEAPONS = ['brass signal bell','steel spanner','brass paperweight','silver letter opener'];
export const PHASE_NAMES = {lobby:'All aboard',briefing:'Your part in the story',plan:'Investigate',read:'Read your findings',discuss:'Compare your stories',final:'One last conversation',vote:'Make your accusation',reveal:'The truth at last'};
export const EMPTY_BALLOT = {killer:'',weapon:'',scene:''};
export function character(id:string|null){return CHARACTERS.find(c=>c.id===id);}
