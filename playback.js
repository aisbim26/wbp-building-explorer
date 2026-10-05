// Forty seconds of active playback covers the complete journey, excluding loading.
export const PLAYBACK_DURATION=40000;
export function createPlayback({getTotal,getStep,onStep,onState,now=()=>performance.now()}){
 let playing=false,start=0,from=0,cursor=0;
 function pause(){if(!playing)return;playing=false;onState(false);}
 function play(){const total=getTotal();if(!total)return;if(getStep()>=total){cursor=0;onStep(0);}from=Math.floor(cursor)===getStep()?cursor:getStep();cursor=from;start=now();playing=true;onState(true);}
 function tick(time=now()){if(!playing)return;const total=getTotal();cursor=Math.min(total,from+Math.max(0,time-start)*total/PLAYBACK_DURATION);const next=Math.floor(cursor);if(next!==getStep())onStep(next);if(next>=total)pause();}
 return {play,pause,tick,toggle(){playing?pause():play()},isPlaying:()=>playing,getPosition:()=>cursor};
}
