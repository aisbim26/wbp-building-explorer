import {createPlayback} from './playback.js?v=20260928c';
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {DRACOLoader} from 'three/addons/loaders/DRACOLoader.js';
import {KTX2Loader} from 'three/addons/loaders/KTX2Loader.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
const $=id=>document.getElementById(id),viewport=$('viewport');
const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,logarithmicDepthBuffer:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setClearColor(0,0);renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;renderer.outputColorSpace=THREE.SRGBColorSpace;viewport.appendChild(renderer.domElement);
const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-90,90,75,-75,0.1,20000),controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.maxPolarAngle=Math.PI*0.495;controls.minZoom=.04;controls.maxZoom=20;controls.autoRotateSpeed=.6;
scene.add(new THREE.HemisphereLight(0xffffff,0x8e9980,1.2));const sun=new THREE.DirectionalLight(0xfff5df,2.1);sun.position.set(-150,250,150);scene.add(sun);
const pmrem=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment();const env=pmrem.fromScene(room,.025);scene.environment=env.texture;scene.environmentIntensity=.5;room.dispose();pmrem.dispose();
const loader=new GLTFLoader().setDRACOLoader(new DRACOLoader().setDecoderPath('./vendor/three/examples/jsm/libs/draco/gltf/')).setKTX2Loader(new KTX2Loader().setTranscoderPath('./vendor/three/examples/jsm/libs/basis/').detectSupport(renderer)).setMeshoptDecoder(MeshoptDecoder);
const config={foundation:{label:'Piles, caps & foundation beams',offset:[0,0,0]},bridge:{label:'Footbridge',offset:[0,0,0]},temporary:{label:'Hoarding & temporary works',offset:[0,0,0]},ground:{label:'Ground & excavation',offset:[0,0,0]},roof:{label:'Roof & skylights',offset:[0,32,0]},facade:{label:'Walls & windows',offset:[-32,4,8]},structure:{label:'Structure & slabs',offset:[0,0,0]},interior:{label:'Interior platforms & equipment',offset:[0,0,0]},canopy:{label:'Entrance & rear canopies',offset:[24,14,0]},loading:{label:'Loading platforms & safety equipment',offset:[18,0,0]},t1_context:{label:'T1 canopy',offset:[0,0,0]},site_extras:{label:'Other site components',offset:[0,0,0]}};
const movingNodes=[],parts={},checks={},contextStates=[];for(const [id,c] of Object.entries(config)){const g=new THREE.Group();g.name=id;g.userData.wbpPart=id;scene.add(g);parts[id]=g;if(!['t1_context','site_extras'].includes(id)){const row=document.createElement('label');row.className='check-row';const input=document.createElement('input');input.type='checkbox';input.checked=true;input.setAttribute('aria-label',c.label);const span=document.createElement('span');span.textContent=c.label;const no=document.createElement('span');no.className='part-index';no.textContent=String(Object.keys(checks).length+1).padStart(2,'0');row.append(input,span,no);$('parts').append(row);checks[id]=input;input.onchange=()=>{preset='custom';applyState();updateCaption()}}}
let demolition,catalog,step=0,activePhase='demolition';const stageNodes=[],phaseCache=new Map(),phaseLoads=new Map();
let mode='building',preset='assembled',activeView='iso',explode=0,targetExplode=0,manifest,partInfo,ready=false,loading=false,wbpLoaded=0,assetErrors=[],lastTime=0;
const focus=new THREE.Vector3(-18,9,52),grid=new THREE.GridHelper(150,30,0xa6b7a3,0xb7c4b0);grid.position.set(-18,5.1,52);grid.material.transparent=true;grid.material.opacity=.13;scene.add(grid);
let fitAspect=1;
function resize(){const w=viewport.clientWidth,h=viewport.clientHeight,span=135,nextAspect=Math.min(1,w/h);camera.zoom*=nextAspect/fitAspect;controls.minZoom*=nextAspect/fitAspect;controls.maxZoom*=nextAspect/fitAspect;fitAspect=nextAspect;camera.left=-span*w/h/2;camera.right=span*w/h/2;camera.top=span/2;camera.bottom=-span/2;camera.updateProjectionMatrix();renderer.setSize(w,h)}new ResizeObserver(resize).observe(viewport);resize();
function setView(v='iso'){
 activeView=v;const center=focus.clone();center.y+=targetExplode*12;
 const directions={iso:new THREE.Vector3(150,140,95),plan:new THREE.Vector3(0,200,.01),front:new THREE.Vector3(-160,30,50)};
 camera.position.copy(center).add(directions[v]);camera.lookAt(center);camera.updateMatrixWorld(true);
 const bounds=phaseCache.get(activePhase)?.bounds;let fit=1;
 if(bounds){const inverse=camera.matrixWorldInverse,projected=new THREE.Box3();for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z])projected.expandByPoint(new THREE.Vector3(x,y,z).applyMatrix4(inverse));const size=projected.getSize(new THREE.Vector3());fit=Math.min((camera.right-camera.left)/Math.max(1,size.x),135/Math.max(1,size.y))*.72;}
 camera.zoom=fit;controls.minZoom=fit*.6;controls.maxZoom=fit*12;camera.updateProjectionMatrix();controls.target.copy(center);controls.cursor.copy(center);controls.maxTargetRadius=(bounds?.getSize(new THREE.Vector3()).length()||150)*.6;controls.update();document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===v));
}
setView();
function visibleInTree(o){for(let p=o;p;p=p.parent)if(!p.visible)return false;return true}
function applyState(){document.body.classList.toggle('airport-context',mode==='site');for(const [id,g]of Object.entries(parts)){g.visible=id==='t1_context'?$('t1').checked:id==='site_extras'?mode==='site':checks[id].checked;g.position.set(0,0,0)}applyDemolition();grid.visible=mode==='building';for(const s of contextStates)if(s.object)s.object.visible=mode==='site'&&(s.group!=='surrounding_buildings'||$('surroundings').checked);$('context-options').hidden=mode!=='site';$('building').classList.toggle('active',mode==='building');$('site').classList.toggle('active',mode==='site')}
function updateCaption(){
 const current=step?demolition?.stages[step-1]:demolition?.initial;
 $('view-title').textContent=current?.title||'WBP demolition sequence';$('view-label').textContent=(demolition?.title||'WBP demolition').toUpperCase();
 $('stage-description').textContent=current?.description||'Preparing the demolition sequence…';
 $('stage-count').textContent=step+' / '+(demolition?.stages.length||47);
 $('explode-value').textContent=Math.round(step/(demolition?.stages.length||47)*100)+'%';
 $('previous-step').disabled=step===0;$('next-step').disabled=step===(demolition?.stages.length||47);
 document.querySelectorAll('[data-preset]').forEach(b=>b.classList.toggle('active',b.dataset.preset===preset));
}
function applyDemolition(){
 if(!demolition)return;
 const visible=new Map(Object.entries(demolition.groups).map(([id,g])=>[id,g.initial]));
 for(const stage of demolition.stages.slice(0,step))for(const change of stage.changes)visible.set(change.group,change.visible);
 for(const n of stageNodes)n.visible=n.userData.phase===activePhase&&visible.get(n.userData.sequenceGroup)!==false;
}
function goStep(value){step=Math.max(0,Math.min(demolition?.stages.length||47,Number(value)));$('explode').value=step;applyDemolition();updateCaption();}
function choosePreset(p){preset=p;targetExplode=0;for(const input of Object.values(checks))input.checked=true;if(p==='roof'||p==='inside')checks.roof.checked=false;if(p==='inside'){checks.facade.checked=false;checks.canopy.checked=false;checks.ground.checked=false}if(p==='substructure'){for(const id of ['roof','facade','structure','ground','interior','canopy','loading','temporary'])checks[id].checked=false;}applyState();updateCaption()}
document.querySelectorAll('[data-preset]').forEach(b=>b.onclick=()=>choosePreset(b.dataset.preset));document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>setView(b.dataset.view));
const playback=createPlayback({getTotal:()=>demolition?.stages.length||0,getStep:()=>step,onStep:goStep,onState:playing=>{$('play').textContent=playing?'Ⅱ Pause':'▶ Play';$('play').setAttribute('aria-label',playing?'Pause sequence':'Play sequence');$('play').setAttribute('aria-pressed',String(playing))}});
$('play').onclick=()=>{if(ready)playback.toggle()};
document.addEventListener('visibilitychange',()=>{if(document.hidden)playback.pause()});
$('explode').oninput=e=>{playback.pause();goStep(e.target.value)};
$('previous-step').onclick=()=>{playback.pause();goStep(step-1)};$('next-step').onclick=()=>{playback.pause();goStep(step+1)};
$('restore').onclick=()=>{playback.pause();choosePreset('assembled');goStep(0)};
$('reset').onclick=()=>{playback.pause();mode='building';$('t1').checked=true;controls.autoRotate=false;$('rotate').classList.remove('active');$('rotate').setAttribute('aria-pressed','false');choosePreset('assembled');goStep(0);setView('iso')};$('fit').onclick=()=>setView(activeView);
$('rotate').onclick=()=>{controls.autoRotate=!controls.autoRotate;$('rotate').classList.toggle('active',controls.autoRotate);$('rotate').setAttribute('aria-pressed',String(controls.autoRotate))};
$('building').onclick=()=>{mode='building';applyState();updateCaption();setView('iso')};$('site').onclick=()=>{mode='site';applyState();updateCaption();setView('iso');loadContext()};$('t1').onchange=applyState;$('surroundings').onchange=applyState;
function prepare(o){o.traverse(m=>{if(m.isMesh){for(const mat of Array.isArray(m.material)?m.material:[m.material])for(const key of ['map','normalMap'])if(mat[key])mat[key].anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy())}})}
let contextFootprint;
async function prepareContextCutout(object,layer){
 if(layer.id==='airport_entrance')return;
 if(!contextFootprint){const response=await fetch('./models/context-footprint.bin?v=20260928c');if(!response.ok)throw Error('Context footprint unavailable');contextFootprint=new THREE.DataTexture(new Uint8Array(await response.arrayBuffer()),512,512,THREE.RedFormat);contextFootprint.needsUpdate=true;}
 object.traverse(mesh=>{if(!mesh.isMesh)return;const adapt=original=>{const mat=original.clone();mat.onBeforeCompile=shader=>{shader.uniforms.siteFootprint={value:contextFootprint};shader.vertexShader='varying vec3 siteWorld;\n'+shader.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\nsiteWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;');shader.fragmentShader='uniform sampler2D siteFootprint;\nvarying vec3 siteWorld;\n'+shader.fragmentShader.replace('#include <clipping_planes_fragment>',`#include <clipping_planes_fragment>
 vec2 siteLocal=vec2(.3241441548*siteWorld.x+.946007669*siteWorld.z-45.40784073,.946007669*siteWorld.x-.3241441548*siteWorld.z+34.13520813);
 vec2 footprintUV=(siteLocal-vec2(-58.,-14.))/vec2(103.,40.);
 if(siteWorld.y<8.0 && all(greaterThanEqual(footprintUV,vec2(0.))) && all(lessThanEqual(footprintUV,vec2(1.))) && texture2D(siteFootprint,footprintUV).r>.5)discard;
 `);};mat.customProgramCacheKey=()=> 'source-soil-footprint';return mat;};mesh.material=Array.isArray(mesh.material)?mesh.material.map(adapt):adapt(mesh.material);});
}
const downloadProgress=new Map();
async function loadBuilding(id=activePhase){
 if(phaseCache.has(id))return;
 if(phaseLoads.has(id))return phaseLoads.get(id);
 const phase=catalog.phases.find(p=>p.id===id),url=phase.asset;
 const promise=(async()=>{try{
  const gltf=await loader.loadAsync(url+'?v='+(id==='foundation_option2'?'20260928f':'20260928c'),event=>{const percent=event.total?Math.round(event.loaded/event.total*100):null;downloadProgress.set(id,{label:percent===100?'Preparing '+phase.title+'…':'Downloading '+phase.title+(percent===null?'…':' · '+percent+'%')});if(activePhase===id)showStatus()});prepare(gltf.scene);gltf.scene.updateMatrixWorld(true);
  const bounds=new THREE.Box3();gltf.scene.traverse(o=>{if(o.isMesh){const box=new THREE.Box3().setFromObject(o);if(Math.max(...box.min.toArray().map(Math.abs),...box.max.toArray().map(Math.abs))<250)bounds.union(box);}});if(bounds.isEmpty())throw Error("No local model bounds");const size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());
  const nodes=[];gltf.scene.traverse(o=>{if(o.userData.sequenceGroup&&o.parent?.userData.sequenceGroup!==o.userData.sequenceGroup)nodes.push(o)});
  if(!nodes.length)throw Error('No sequence groups in model');
  for(const node of nodes){const category=node.userData.wbpPart;if(!parts[category])throw Error('Unknown part '+category);node.userData.phase=id;node.visible=false;parts[category].attach(node);stageNodes.push(node);node.traverse(o=>{if(o.isMesh)o.userData.part=category;});}
  phaseCache.set(id,{center,bounds,zoom:Math.min(1.35,110/Math.max(size.x,size.z,size.y*1.4)),nodes:nodes.length});
 }catch(e){assetErrors.push({phase:id,url,error:String(e)});console.error(e)}finally{phaseLoads.delete(id);}
 })();phaseLoads.set(id,promise);return promise;
}
async function selectPhase(id){
 playback.pause();
 document.querySelector('[data-preset=substructure]').hidden=!['foundation','removal','foundation_option2'].includes(id);activePhase=id;demolition=catalog.phases.find(p=>p.id===id);step=0;preset='assembled';ready=false;
 document.querySelectorAll('[data-phase]').forEach(b=>{b.classList.toggle('active',b.dataset.phase===id);b.setAttribute('aria-pressed',String(b.dataset.phase===id))});$('explode').max=demolition.stages.length;$('explode').value=0;
 for(const input of Object.values(checks))input.checked=true;
 applyState();updateCaption();showStatus();await loadBuilding(id);
 if(activePhase!==id)return;
 ready=phaseCache.has(id);wbpLoaded=phaseCache.size;
 if(ready){focus.copy(phaseCache.get(id).center);grid.position.set(focus.x,Math.min(5.1,focus.y-2),focus.z);}
 for(const [category,input]of Object.entries(checks)){input.closest('label').hidden=!stageNodes.some(n=>n.userData.phase===id&&n.userData.wbpPart===category);}
 applyState();updateCaption();setView(activeView);showStatus();
}
function showStatus(){
 $('play').disabled=!ready;const bad=assetErrors.some(e=>!e.phase||e.phase===activePhase);$('retry').hidden=!bad;$('status').textContent=bad?'Some components could not load. Please retry.':!ready?(downloadProgress.get(activePhase)?.label||'Loading '+(demolition?.title||'project')+'…'):mode==='site'&&contextStates.some(s=>!s.object)?'Model ready · Loading airport context':'Model ready';}
async function loadContext(){if(loading||!manifest)return;loading=true;try{for(const s of contextStates){if(s.object||mode!=='site')continue;try{const gltf=await loader.loadAsync(s.url);prepare(gltf.scene);await prepareContextCutout(gltf.scene,s);s.object=gltf.scene;scene.add(s.object);applyState()}catch(e){assetErrors.push({url:s.url,error:String(e)});console.error(e)}showStatus()}}finally{loading=false;showStatus()}}
$('retry').onclick=async()=>{assetErrors=[];await selectPhase(activePhase);if(mode==='site')loadContext()};
document.querySelectorAll('[data-phase]').forEach(b=>b.onclick=()=>selectPhase(b.dataset.phase));
$('panel-toggle').onclick=()=>{const open=document.body.classList.toggle('controls-open');$('panel-toggle').setAttribute('aria-expanded',String(open))};
try{const results=await Promise.all([fetch('./manifest.json?v=20260928c'),fetch('./sequences.json?v=20260928f')]);if(results.some(r=>!r.ok))throw Error('Could not load the project manifest');[manifest,catalog]=await Promise.all(results.map(r=>r.json()));contextStates.push(...manifest.layers.filter(l=>!['target_building','building_details','source_reference'].includes(l.group)).map(l=>({...l,object:null})));await selectPhase('demolition');}catch(e){assetErrors.push({error:String(e)});showStatus();console.error(e)}
const ray=new THREE.Raycaster(),pointer=new THREE.Vector2();let down,hoverPart=null,lastHover=0;
function intersect(e){const r=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,1-(e.clientY-r.top)/r.height*2);ray.setFromCamera(pointer,camera);const roots=[...Object.values(parts),...contextStates.filter(s=>s.object).map(s=>s.object)].filter(o=>o.visible);return ray.intersectObjects(roots,true).find(h=>visibleInTree(h.object))}
renderer.domElement.addEventListener('pointerdown',e=>{down=[e.clientX,e.clientY]});renderer.domElement.addEventListener('pointerup',e=>{if(!down||!ready||Math.hypot(e.clientX-down[0],e.clientY-down[1])>5)return;const hit=intersect(e);if(!hit)return;const id=hit.object.userData.part;const p=hit.point.clone();if(id){let n=hit.object;while(n&&!n.userData.explodeVector)n=n.parent;if(n)p.add(n.userData.restPosition).sub(n.position);}const o=manifest.origin;$('position').textContent=`${config[id]?.label||'Site'} · Original HK1980 E ${(p.x+o.easting).toFixed(2)} / N ${(o.northing-p.z).toFixed(2)} / H ${p.y.toFixed(2)} m`;});
renderer.domElement.addEventListener('pointermove',e=>{if(e.buttons||performance.now()-lastHover<120)return;lastHover=performance.now();const h=intersect(e),id=h?.object.userData.part;hoverPart=id||null;$('hover-label').hidden=!id;if(id){const r=viewport.getBoundingClientRect();$('hover-label').textContent=config[id].label;$('hover-label').style.left=Math.min(e.clientX-r.left+14,r.width-180)+'px';$('hover-label').style.top=(e.clientY-r.top+14)+'px'}});renderer.domElement.addEventListener('pointerleave',()=>{$('hover-label').hidden=true});
renderer.setAnimationLoop(t=>{playback.tick(t);const dt=Math.min((t-lastTime)/1000,.05);lastTime=t;if(Math.abs(explode-targetExplode)>.0001){explode=THREE.MathUtils.damp(explode,targetExplode,8,dt);if(Math.abs(explode-targetExplode)<.0001)explode=targetExplode;applyState()}controls.update();const north=new THREE.Vector3(0,0,-1).applyQuaternion(camera.quaternion.clone().invert());$('north-arrow').style.transform=`rotate(${Math.atan2(north.x,north.y)}rad)`;renderer.render(scene,camera)});
const diagnostics=document.createElement('script');diagnostics.type='application/json';diagnostics.id='viewer-diagnostics';document.body.appendChild(diagnostics);setInterval(()=>{diagnostics.textContent=JSON.stringify({ready,playing:playback.isPlaying(),mode,preset,activePhase,loadedPhases:[...phaseCache.keys()],step,totalSteps:demolition?.stages.length,stageTitle:$('view-title').textContent,visibleGroups:stageNodes.filter(n=>n.userData.phase===activePhase&&n.visible).length,hiddenControllers:[...new Set(stageNodes.filter(n=>n.userData.phase===activePhase&&!n.visible).map(n=>n.userData.sequenceGroup))],addedProtection:stageNodes.filter(n=>n.visible&&n.userData.wbpPart==='temporary').length,explode,targetExplode,wbpLoaded,errors:assetErrors,parts:Object.fromEntries(Object.entries(parts).map(([k,v])=>[k,{visible:v.visible,offset:v.position.toArray(),children:v.children.length}])),directions:movingNodes.map(n=>({part:n.userData.wbpPart,direction:n.userData.explodeDirection,offset:n.position.clone().sub(n.userData.restPosition).toArray()})),contextLoaded:contextStates.filter(s=>s.object).length,contextTotal:contextStates.length,camera:camera.position.toArray(),target:controls.target.toArray(),focus:focus.toArray(),zoom:camera.zoom,minZoom:controls.minZoom,maxZoom:controls.maxZoom,drawCalls:renderer.info.render.calls})},500);







