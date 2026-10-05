export const clamp=(n,min,max)=>Math.max(min,Math.min(max,Number(n)||0));

export function resolvePosition(project,position){
  const value=Math.round(clamp(position,0,project.totalSteps));
  const chapter=project.chapters.find(c=>value>=c.start&&value<=c.end)||project.chapters.at(-1);
  const local=value-chapter.start,progress=local/chapter.length;
  return {value,chapter,local,progress,views:chapter.phaseIds.map(id=>{
    const phase=project.phases.find(p=>p.id===id),step=Math.round(progress*phase.stages.length);
    return {phase,step,caption:step?phase.stages[step-1]:phase.initial};
  })};
}

export function visibility(phase,step){
  const states=Object.fromEntries(Object.entries(phase.groups).map(([id,g])=>[id,g.initial]));
  for(const stage of phase.stages.slice(0,step))for(const c of stage.changes)states[c.group]=c.visible;
  return states;
}

// Three.js receives decoded bytes, while HTTP Content-Length may describe gzip bytes.
// Expected size comes from the actual published asset, never the transfer headers.
export function downloadFraction(loaded,expected){
  return expected>0?clamp(loaded/expected,0,1):null;
}

export function validateProject(project){
  if(project.schemaVersion!==1)throw Error('Unsupported project data');
  const ids=new Set(project.phases.map(p=>p.id));
  for(const c of project.chapters)for(const id of c.phaseIds)if(!ids.has(id))throw Error('Missing model: '+id);
  for(const p of project.phases)for(const stage of p.stages)for(const c of stage.changes)if(!p.groups[c.group])throw Error('Missing component: '+c.group);
  return project;
}
