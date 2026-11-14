export type Phase = 'lobby' | 'briefing' | 'plan' | 'read' | 'discuss' | 'final' | 'vote' | 'reveal';
export type Carriage = 'lounge' | 'dining' | 'sleeper' | 'luggage';
export type Action = { type: 'investigate' | 'test' | 'retrieve' | 'secret' | 'pass'; target?: string };
export type Ballot = { killer: string; weapon: string; scene: string };
export type Interference = { type: 'jam' | 'plant'; target?: string };
export type Evidence = { id: string; title: string; text: string; kind: 'verified' | 'untested' | 'testimony'; location: Carriage; round?: number };
export type LeadView = { id: string; title: string; description: string; location: Carriage; cost: number; unlock: number; progress: number; reserved: number; jammed: boolean; complete: boolean; owned: boolean; published: boolean };
export type PassengerView = { id: string; name: string; characterId: string | null; ready: boolean; approved: boolean; bot: boolean; connected: boolean; host: boolean; role?: 'killer' | 'investigator' };
export type LogEvent = { id: string; text: string; round: number; type: 'story' | 'discovery' | 'sabotage' | 'system' };
export type Message = { id: string; playerId: string; name: string; text: string; at: number };
export type RoomView = {
  code: string; version: number; phase: Phase; round: number; deadline: number | null;
  serverNow: number; preset: 'voice' | 'text'; practice: boolean; hostId: string;
  pausedUntil: number | null; pauseUsed: boolean; incomplete: boolean;
  players: PassengerView[]; leads: LeadView[]; board: Evidence[]; reports: Evidence[];
  tested: string[]; events: LogEvent[]; messages: Message[];
  me: { id: string; name: string; approved: boolean; ready: boolean; characterId: string | null;
    role: 'killer' | 'investigator' | null; account: string; secret: string; objective: string;
    inventory: Evidence[]; action: Action | null; interference: Interference | null;
    tokens: number | null; planted: boolean; personalDone: boolean; note: string; ballot: Ballot;
    notebook: Record<string, boolean> };
  reveal: null | { killer: string; weapon: string; scene: string; narrative: string; explanation: string; correct: number; required: number;
    winner: 'investigators' | 'killer'; ballots: {name: string; characterId: string; role: string; ballot: Ballot; reconstruction: boolean}[] };
};
export type Command =
 | { type: 'ready'; ready: boolean }
 | { type: 'approve' | 'remove'; playerId: string }
 | { type: 'start' | 'publishAll' | 'advance' | 'delete' }
 | { type: 'preset'; preset: 'voice' | 'text' }
 | { type: 'action'; action: Action; round: number }
 | { type: 'interference'; interference: Interference | null; round: number }
 | { type: 'publish'; evidenceId: string }
 | { type: 'ballot'; ballot: Ballot }
 | { type: 'note'; note: string; notebook: Record<string, boolean> }
 | { type: 'message'; text: string };
