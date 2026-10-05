// Six shots / five transitions, anchored to the actual sequence boundaries.
// Camera movement is presentation only; it does not alter geometry or visibility.
export function cameraShots(project){
 const chapter=id=>project.chapters.find(c=>c.id===id);
 const stage=(c,pattern)=>{
  const p=project.phases.find(p=>p.id===c.phaseIds[0]);
  const i=p.stages.findIndex(s=>pattern.test(s.title));
  return c.start+(i<0?Math.round(c.length*.6):i+1);
 };
 const d=chapter('demolition'),r=chapter('removal'),f=chapter('foundations'),b=chapter('building');
 return [
  {id:'wbp-demolition',label:'WBP demolition',chapter:d.id,start:d.start,azimuth:[58,48],elevation:[40,46]},
  {id:'canopy-demolition',label:'T1 canopy and remaining structure',chapter:d.id,start:stage(d,/Install temporary protection platform/i),azimuth:[83,72],elevation:[42,48]},
  {id:'foundation-removal',label:'Existing foundation removal',chapter:r.id,start:r.start,azimuth:[58,53],elevation:[67,62]},
  {id:'foundation-comparison',label:'New foundation options',chapter:f.id,start:f.start,azimuth:[57,72],elevation:[59,51]},
  {id:'steel-construction',label:'Steel frame and internal platforms',chapter:b.id,start:b.start,azimuth:[51,41],elevation:[31,38]},
  {id:'building-completion',label:'Roof, facade and footbridge',chapter:b.id,start:stage(b,/Install barrel-roof supports/i),azimuth:[32,55],elevation:[34,42]},
 ].map((shot,i,all)=>({...shot,end:all[i+1]?.start??project.totalSteps}));
}
const lerp=(a,b,t)=>a+(b-a)*t;
export function sampleShot(shots,position){
 const shot=shots.findLast(s=>position>=s.start)||shots[0];
 const progress=Math.max(0,Math.min(1,(position-shot.start)/Math.max(1,shot.end-shot.start)));
 return {...shot,progress,azimuth:lerp(...shot.azimuth,progress),elevation:lerp(...shot.elevation,progress)};
}

// Average nearby real work groups: no invented locations and no rapid jumps
// between the many small piles. Both options contribute to the comparison view.
export function workFocus(phase,step,boxes,Vector3){
 const center=new Vector3();let weight=0;
 for(let i=Math.max(0,Math.floor(step)-3);i<Math.min(phase.stages.length,Math.floor(step)+4);i++){
  const influence=1/(1+Math.abs(i+1-step));
  const valid=phase.stages[i].changes.map(c=>boxes.get(c.group)).filter(Boolean);
  if(!valid.length)continue;
  const midpoint=new Vector3();for(const box of valid)midpoint.add(box.getCenter(new Vector3()));
  center.addScaledVector(midpoint.multiplyScalar(1/valid.length),influence);weight+=influence;
 }
 return weight?center.multiplyScalar(1/weight):null;
}
