import * as THREE from 'three';
import {cameraShots,sampleShot,workFocus} from './camera-tour.js?v=20261005e';

export class CameraDirector {
 constructor(viewer,project){this.viewer=viewer;this.shots=cameraShots(project);this.project=project;this.active=false;this.shot=null;this.camera=new THREE.OrthographicCamera();}
 start(){
  this.active=true;this.shot=null;this.lastTime=null;this.smoothedTarget=null;this.viewer.guided=true;this.viewer.autoRotate=false;
  for(const v of this.viewer.views){const damping=v.controls.enableDamping;v.controls.enableDamping=false;v.controls.autoRotate=false;v.controls.update();v.controls.enableDamping=damping;}
 }
 stop(){this.active=false;this.viewer.guided=false;}
 update(position,time){
  if(!this.active||!this.viewer.center)return;
  const shot=sampleShot(this.shots,position),views=this.viewer.views.filter(v=>v.phase);
  if(this.shot?.id!==shot.id){
   this.transitionStart=time;
   const master=views[0];
   this.from={target:master.controls.target.clone(),rotation:master.camera.quaternion.clone(),zoom:master.camera.zoom};
  }
  this.shot=shot;
  const az=THREE.MathUtils.degToRad(shot.azimuth),el=THREE.MathUtils.degToRad(shot.elevation);
  const direction=new THREE.Vector3(Math.cos(el)*Math.sin(az),Math.sin(el),Math.cos(el)*Math.cos(az));
  this.camera.position.copy(direction);this.camera.lookAt(0,0,0);this.camera.updateMatrixWorld(true);
  const rotation=this.camera.quaternion,right=new THREE.Vector3().setFromMatrixColumn(this.camera.matrixWorld,0),up=new THREE.Vector3().setFromMatrixColumn(this.camera.matrixWorld,1);
  let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
  const focus=new THREE.Vector3();let focusCount=0;
  const chapter=this.project.chapters.find(c=>c.id===shot.chapter);
  const progress=THREE.MathUtils.clamp((position-chapter.start)/chapter.length,0,1);
  for(const v of views){
   const entry=this.viewer.cache.get(v.phase.id);
   for(const point of entry.framingPoints){const x=point.dot(right),y=point.dot(up);minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);}
   const local=workFocus(v.phase,progress*v.phase.stages.length,entry.groupBoxes,THREE.Vector3);
   if(local){focus.add(local);focusCount++;}
  }
  if(!Number.isFinite(minX+maxX+minY+maxY))return;
  const width=Math.max(1,maxX-minX),height=Math.max(1,maxY-minY),center=this.viewer.center;
  const target=center.clone().addScaledVector(right,(minX+maxX)/2-center.dot(right)).addScaledVector(up,(minY+maxY)/2-center.dot(up));
  if(focusCount){focus.multiplyScalar(1/focusCount).sub(target);target.addScaledVector(right,THREE.MathUtils.clamp(focus.dot(right)*.25,-width*.045,width*.045)).addScaledVector(up,THREE.MathUtils.clamp(focus.dot(up)*.25,-height*.045,height*.045));}
  // Damp tracking across adjacent work groups instead of jumping at step changes.
  const delta=this.lastTime===null?1/60:Math.max(0,Math.min(.1,(time-this.lastTime)/1000));this.lastTime=time;
  if(!this.smoothedTarget)this.smoothedTarget=this.from.target.clone();
  this.smoothedTarget.lerp(target,1-Math.exp(-delta/.45));
  const blend=1-Math.pow(1-THREE.MathUtils.clamp((time-this.transitionStart)/1100,0,1),3);
  views.forEach(v=>{
   const frame=matchMedia('(min-width:761px)').matches?v.surface.parentElement:v.surface;
   if(!frame.clientWidth||!frame.clientHeight)return;
   const fit=Math.min((v.camera.right-v.camera.left)*v.surface.clientWidth/frame.clientWidth/width,(v.camera.top-v.camera.bottom)*v.surface.clientHeight/frame.clientHeight/height);
   const zoom=fit*(.82+.025*Math.sin(Math.PI*shot.progress)),from=this.from;
   v.controls.target.copy(from.target).lerp(this.smoothedTarget,blend);v.controls.cursor.copy(v.controls.target);
   v.camera.quaternion.copy(from.rotation).slerp(rotation,blend);
   v.camera.position.set(0,0,250).applyQuaternion(v.camera.quaternion).add(v.controls.target);
   v.camera.zoom=THREE.MathUtils.lerp(Math.min(from.zoom,fit*.9),zoom,blend);v.camera.updateProjectionMatrix();
   v.fitZoom=fit*.88;v.controls.minZoom=v.fitZoom*.6;v.controls.maxZoom=v.fitZoom*12;
   v.controls.maxTargetRadius=this.viewer.bounds.getSize(new THREE.Vector3()).length()*.6;
  });
 }
}
