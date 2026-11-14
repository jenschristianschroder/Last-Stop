// SERVER ONLY. Never import this module from a client component.
import type { Carriage, Evidence } from '../lib/types';
export const CASE_VERSION = 'bell-001.1';
export const TRUTH = {killer:'cora',weapon:'brass signal bell',scene:'sleeper'};
export const REVELATION = {
  narrative:'Victor knew about Cora’s false reimbursement claim. At 21:11, she silenced him in the sleeper, then moved his body to the vestibule.',
  explanation:'The carriage fibres and timed seals establish the sleeper. Inventory coating and brass identify the bell. The access and custody lists overlap on just one name: Cora Vale.'
};
export const DOSSIERS: Record<string,{account:string;secret:string;objective:string}> = {
  ada:{account:'You were alone in the lounge from 21:10 to 21:12. You did not kill Victor. You saw nobody clearly enough to give them an alibi.',secret:'At 19:55 you changed a sleeper reservation to hide a booking error. Victor knew.',objective:'Recover the original booking slip.'},
  ben:{account:'You were in a lounge alcove during the murder window, with no view of the other seats. You returned the signal bell after rehearsal at 20:45. You do not know who held it later.',secret:'Victor threatened to report your unpaid licensing fee.',objective:'Recover the receipt that settles the fee.'},
  cora:{account:'You killed Victor with the brass signal bell in the sleeper at 21:11. You collected the bell at 21:07, met him at 21:10, and moved the body through luggage to the vestibule by 21:14. Your cover: you worked alone in the lounge.',secret:'Victor was blackmailing you over a false reimbursement claim.',objective:'Recover the duplicate reimbursement claim.'},
  daan:{account:'You were alone in the rear recess of the lounge during the murder window. You did not see anyone clearly enough to establish an alibi.',secret:'You owe Victor money under a note signed at 20:20.',objective:'Recover the repayment agreement.'},
  eli:{account:'You were alone in your sleeper compartment during the murder window. You heard nothing you can place reliably. You did not kill Victor.',secret:'At 20:30 you delivered a letter about a private family dispute to Victor’s tray.',objective:'Recover the delivery receipt.'},
  freya:{account:'You were alone in the lounge’s writing booth during the murder window. You did not see another passenger.',secret:'At 20:15 you argued with Victor over publishing an embarrassing letter.',objective:'Recover your original interview notes.'}
};
export type Lead = {id:string;title:string;description:string;location:Carriage;cost:number;unlock:number;fact:string;text:string};
export const LEADS:Lead[] = [
  {id:'E1',title:'A trace of carriage fabric',description:'Compare the fibres found on Victor’s coat.',location:'lounge',cost:2,unlock:1,fact:'F1',text:'The original attack occurred in either the sleeper or luggage carriage. The matched carriage fabric excludes the lounge and dining car.'},
  {id:'E2',title:'The timed carriage seals',description:'Reconcile the sealed doors with the murder window.',location:'dining',cost:2,unlock:2,fact:'F2',text:'Complete seal records exclude dining and luggage as the attack site during 21:10–21:12. The scene was either sleeper or lounge. The seals released at 21:12.'},
  {id:'E3',title:'A railway-issued object',description:'Compare the object trace with the railway inventory.',location:'luggage',cost:3,unlock:1,fact:'F3',text:'The attack object carried the railway inventory coating. Of the four listed objects, only the brass signal bell and steel spanner have that coating.'},
  {id:'E4',title:'Something in the metal',description:'Examine a sample left by the attack object.',location:'lounge',cost:3,unlock:2,fact:'F4',text:'The attack object was brass. Of the four listed objects, only the signal bell and paperweight are brass.'},
  {id:'E5a',title:'Behind the sleeper doors',description:'Audit every possible entry during the murder window.',location:'sleeper',cost:2,unlock:3,fact:'F5',text:'During 21:10–21:12, only Ada Reed, Cora Vale, or Eli March could enter the sleeper. If the attack occurred there, the killer is one of those three.'},
  {id:'E6a',title:'The bell’s missing minutes',description:'Check the complete bell custody register.',location:'dining',cost:2,unlock:4,fact:'F6',text:'The complete bell custody record limits potential handlers during 21:10–21:12 to Ben Ward, Cora Vale, and Daan Voss. If the bell was the weapon, the killer is one of those three.'},
  {id:'E5b',title:'The conductor’s key ledger',description:'Ask Mara to check her duplicate key register.',location:'dining',cost:2,unlock:3,fact:'F5',text:'Mara admits her notebook was incomplete. Her duplicate key ledger, reconciled with the issued-key register, independently confirms that only Ada Reed, Cora Vale, or Eli March could enter the sleeper during 21:10–21:12.'},
  {id:'E6b',title:'The station counterfoils',description:'Follow a second record of the bell’s movements.',location:'luggage',cost:2,unlock:4,fact:'F6',text:'Independently retained station counterfoils reconcile every bell transfer. Only Ben Ward, Cora Vale, or Daan Voss could have handled it during 21:10–21:12.'}
];
export const REPORTS = [
  {id:'T1',title:'A musician and a bell',location:'dining' as Carriage,ordinary:'Ben was seen carrying the signal bell earlier tonight.',planted:'Ben was seen carrying the signal bell just before the body was found.',test:'The source image is from 20:40. Ben returned the bell at 20:45. This report establishes no alibi or custody fact during 21:10–21:12.'},
  {id:'T2',title:'An altered reservation',location:'sleeper' as Carriage,ordinary:'Ada changed a sleeper reservation before departure.',planted:'Ada changed a sleeper reservation after the alarm.',test:'The reservation edit was recorded at 19:55. It establishes no location or access fact during 21:10–21:12.'},
  {id:'T3',title:'An argument overheard',location:'lounge' as Carriage,ordinary:'Freya argued with Victor over a letter before dinner.',planted:'Freya was heard threatening Victor in the sleeper near the murder window.',test:'The cited recording is an argument in the lounge at 20:15. Its timestamp and location establish no murder-window alibi.'},
  {id:'T4',title:'A debt to settle',location:'lounge' as Carriage,ordinary:'Daan owes Victor money.',planted:'Daan offered money to hide the signal bell after the alarm.',test:'The cited payment note concerns a debt agreed at 20:20. It contains no request to hide an object and gives no murder-window alibi.'},
  {id:'T5',title:'A letter for the victim',location:'luggage' as Carriage,ordinary:'Eli carried a sealed letter intended for Victor.',planted:null,test:'The letter was delivered to Victor’s tray at 20:30. It concerns a family dispute and establishes no murder-window alibi.'}
];
export function evidence(id:string):Evidence|null {
  const l=LEADS.find(l=>l.id===id);
  if(l)return {id:l.id,title:l.title,text:l.text,kind:'verified',location:l.location};
  const t=REPORTS.find(t=>t.id+'-test'===id);
  return t ? {id,title:t.title+' · checked',text:t.test,kind:'verified',location:t.location} : null;
}
