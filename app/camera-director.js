import * as THREE from 'three';
import {cameraShots,sampleShot} from './camera-tour.js?v=20261005g';

export class CameraDirector {
 constructor(viewer,project){this.viewer=viewer;this.project=project;this.shots=cameraShots(project);this.active=false;this.shot=null;this.anchors=new Map();this.camera=new THREE.OrthographicCamera();}
 start(){
  this.active=true;this.shot=null;this.viewer.guided=true;this.viewer.autoRotate=false;
  for(const v of this.viewer.views){const damping=v.controls.enableDamping;v.controls.enableDamping=false;v.controls.autoRotate=false;v.controls.update();v.controls.enableDamping=damping;}
 }
 stop(){this.active=false;this.viewer.guided=false;}
 anchor(definition){
  const id=JSON.stringify(definition);if(this.anchors.has(id))return this.anchors.get(id);
  const phase=this.project.phases.find(p=>p.id===definition.phase),entry=this.viewer.cache.get(definition.phase),bounds=new THREE.Box3();
  for(const step of definition.stages)for(const change of phase.stages[step-1]?.changes||[]){const box=entry.groupBoxes.get(change.group);if(box)bounds.union(box);}
  // Use the current local works bounds if a source group is unavailable.
  const point=(bounds.isEmpty()?entry.bounds:bounds).getCenter(new THREE.Vector3()).add(new THREE.Vector3(...definition.offset));
  this.anchors.set(id,point);return point;
 }
 update(position){
  if(!this.active||!this.viewer.center)return;
  const shot=sampleShot(this.shots,position);this.shot=shot;
  const views=this.viewer.views.filter(v=>v.phase),phone=matchMedia('(max-width:760px)').matches;
  const az=THREE.MathUtils.degToRad(phone?(shot.phoneAzimuth??shot.azimuth):shot.azimuth),el=THREE.MathUtils.degToRad(shot.elevation);
  const direction=new THREE.Vector3(Math.cos(el)*Math.sin(az),Math.sin(el),Math.cos(el)*Math.cos(az));
  this.camera.position.copy(direction);this.camera.lookAt(0,0,0);this.camera.updateMatrixWorld(true);
  const rotation=this.camera.quaternion,right=new THREE.Vector3().setFromMatrixColumn(this.camera.matrixWorld,0),up=new THREE.Vector3().setFromMatrixColumn(this.camera.matrixWorld,1);
  const target=this.anchor(shot.from.focus).clone().lerp(this.anchor(shot.to.focus),shot.blend);
  const width=THREE.MathUtils.lerp(shot.from[phone?'phoneWidth':'width'],shot.to[phone?'phoneWidth':'width'],shot.blend);
  const height=THREE.MathUtils.lerp(shot.from[phone?'phoneHeight':'height'],shot.to[phone?'phoneHeight':'height'],shot.blend);
  // Each shot cuts to its authored angle. Inside a shot only the authored
  // push-in or straight pan/lift can change the otherwise locked framing.
  for(const v of views){
   const frame=phone?v.surface:v.surface.parentElement;
   if(!frame.clientWidth||!frame.clientHeight)continue;
   const w=v.camera.right-v.camera.left,h=v.camera.top-v.camera.bottom;
   const zoom=Math.min(w*v.surface.clientWidth/frame.clientWidth/width,h*v.surface.clientHeight/frame.clientHeight/height)*.94;
   const fr=frame.getBoundingClientRect(),sr=v.surface.getBoundingClientRect();
   const dx=(sr.left+sr.width/2-fr.left-fr.width/2)/fr.width*w/zoom,dy=(sr.top+sr.height/2-fr.top-fr.height/2)/fr.height*h/zoom;
   v.controls.target.copy(target).addScaledVector(right,-dx).addScaledVector(up,dy);v.controls.cursor.copy(v.controls.target);
   v.camera.quaternion.copy(rotation);v.camera.position.copy(direction).multiplyScalar(250).add(v.controls.target);
   v.camera.zoom=zoom;v.camera.updateProjectionMatrix();
   v.fitZoom=zoom;v.controls.minZoom=zoom*.35;v.controls.maxZoom=zoom*12;
   v.controls.maxTargetRadius=this.viewer.bounds.getSize(new THREE.Vector3()).length();
  }
 }
}
