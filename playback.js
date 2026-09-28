// Ten seconds covers a complete phase. Resuming preserves the same pace.
export function createPlayback({getTotal,getStep,onStep,onState,now=()=>performance.now()}){
 let playing=false,start=0,from=0;
 function pause(){if(!playing)return;playing=false;onState(false);}
 function play(){const total=getTotal();if(!total)return;if(getStep()>=total)onStep(0);from=getStep();start=now();playing=true;onState(true);}
 function tick(time=now()){if(!playing)return;const total=getTotal(),next=Math.min(total,Math.floor(from+(time-start)*total/10000));if(next!==getStep())onStep(next);if(next>=total)pause();}
 return {play,pause,tick,toggle(){playing?pause():play()},isPlaying:()=>playing};
}
