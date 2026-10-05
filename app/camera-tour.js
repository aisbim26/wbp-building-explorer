// Authored shots: fixed angles, deliberate close-ups and straight camera moves.
// Anchors reference source sequence groups; no per-frame tracking or auto orbit.
const anchor=(phase,stages,offset=[0,0,0])=>({phase,stages,offset});
const key=(at,focus,width,height,phoneWidth=width,phoneHeight=height)=>({at,focus,width,height,phoneWidth,phoneHeight});
export function cameraShots(project){
 const chapter=id=>project.chapters.find(c=>c.id===id);
 const stage=(c,pattern)=>{
  const p=project.phases.find(p=>p.id===c.phaseIds[0]);
  const i=p.stages.findIndex(s=>pattern.test(s.title));
  return c.start+(i<0?Math.round(c.length*.6):i+1);
 };
 const d=chapter('demolition'),r=chapter('removal'),f=chapter('foundations'),b=chapter('building');
 const site=anchor('demolition',[1,2,3,4]),roof=anchor('demolition',[15,16]),roofEnd=anchor('demolition',[17]);
 const t1=anchor('demolition',[30,32]),rear=anchor('demolition',[35]),rearEnd=anchor('demolition',[37]);
 const excavation=anchor('removal',[2,3]);
 const pilesNear=anchor('foundation',[3,4,6]),pilesFar=anchor('foundation',[9,10,11]);
 const steel=anchor('building',[1,2,3,4,5,6,7,8]);
 const steelLow={...steel,offset:[0,-7,0]},steelHigh={...steel,offset:[0,7,0]};
 const bridge=anchor('building',[47,48]);
 return [
  {id:'roof-close-up',label:'Roof and structural details',chapter:d.id,start:d.start,azimuth:-45,elevation:42,keys:[
   key(0,site,112,58,60,70),key(.12,site,112,58,60,70),
   key(.42,roof,54,28,36,32),key(.62,roof,54,28,36,32),key(1,roofEnd,54,28,36,32)]},
  {id:'canopy-side-pan',label:'T1 canopy and rear bays — high side view',chapter:d.id,start:stage(d,/Install temporary protection platform/i),azimuth:35,elevation:65,keys:[
   key(0,t1,56,32,38,34),key(.18,t1,56,32,38,34),key(.45,rear,48,28,34,30),key(.9,rearEnd,48,28,34,30),key(1,rearEnd,48,28,34,30)]},
  {id:'excavation-plan',label:'Foundation removal — overhead',chapter:r.id,start:r.start,azimuth:109,phoneAzimuth:19,elevation:89.5,keys:[
   key(0,excavation,108,38,36,108),key(1,excavation,108,38,36,108)]},
  {id:'foundation-traverse',label:'Foundation options — close lateral traverse',chapter:f.id,start:f.start,azimuth:-71,elevation:57,keys:[
   key(0,pilesNear,60,34),key(.16,pilesNear,60,34),key(.86,pilesFar,60,34),key(1,pilesFar,60,34)]},
  {id:'steel-elevation',label:'Steel structure — opposite elevation',chapter:b.id,start:b.start,azimuth:-71,elevation:17,keys:[
   key(0,steelLow,86,40,36,40),key(.2,steelLow,86,40,36,40),key(.85,steelHigh,86,40,36,40),key(1,steelHigh,86,40,36,40)]},
  {id:'facade-to-bridge',label:'Roof and footbridge — close-up',chapter:b.id,start:stage(b,/Install barrel-roof supports/i),azimuth:-20,elevation:65,keys:[
   key(0,steel,80,42,38,40),key(.35,steel,80,42,38,40),key(.85,bridge,44,28,34,32),key(1,bridge,44,28,34,32)]},
 ].map((shot,i,all)=>({...shot,end:all[i+1]?.start??project.totalSteps}));
}
export function sampleShot(shots,position){
 const shot=shots.findLast(s=>position>=s.start)||shots[0];
 const progress=Math.max(0,Math.min(1,(position-shot.start)/Math.max(1,shot.end-shot.start)));
 const index=Math.max(0,shot.keys.findIndex((k,i)=>i<shot.keys.length-1&&progress<=shot.keys[i+1].at));
 const from=shot.keys[index],to=shot.keys[index+1];
 const t=Math.max(0,Math.min(1,(progress-from.at)/Math.max(.001,to.at-from.at)));
 // The shot holds before/after a move. No sinusoidal zoom or shifting focus.
 return {...shot,progress,from,to,blend:t*t*(3-2*t)};
}
