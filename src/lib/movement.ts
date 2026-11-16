export type Point={x:number;y:number};
export type Motion={from:Point;to:Point;start:number;end:number};
export const SPAWN:Point={x:180,y:320};
export function positionAt(motion:Motion|null|undefined,now:number):Point{
  if(!motion)return SPAWN;
  const t=Math.max(0,Math.min(1,(now-motion.start)/Math.max(1,motion.end-motion.start)));
  return {x:motion.from.x+(motion.to.x-motion.from.x)*t,y:motion.from.y+(motion.to.y-motion.from.y)*t};
}
export function objectPoint(index:number):Point{return {x:index%2?210:150,y:180+index*140};}
