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
const config={roof:{label:'Roof & skylights',offset:[0,32,0]},facade:{label:'Walls & windows',offset:[-32,4,8]},structure:{label:'Structure & slabs',offset:[0,0,0]},interior:{label:'Interior platforms & equipment',offset:[0,0,0]},canopy:{label:'Entrance & rear canopies',offset:[24,14,0]},loading:{label:'Loading platforms & safety equipment',offset:[18,0,0]},t1_context:{label:'T1 canopy',offset:[0,0,0]},site_extras:{label:'Other site components',offset:[0,0,0]}};
const movingNodes=[],parts={},checks={},contextStates=[];for(const [id,c] of Object.entries(config)){const g=new THREE.Group();g.name=id;g.userData.wbpPart=id;scene.add(g);parts[id]=g;if(!['t1_context','site_extras'].includes(id)){const row=document.createElement('label');row.className='check-row';const input=document.createElement('input');input.type='checkbox';input.checked=true;input.setAttribute('aria-label',c.label);const span=document.createElement('span');span.textContent=c.label;const no=document.createElement('span');no.className='part-index';no.textContent=String(Object.keys(checks).length+1).padStart(2,'0');row.append(input,span,no);$('parts').append(row);checks[id]=input;input.onchange=()=>{preset='custom';applyState();updateCaption()}}}
let demolition,step=0;const stageNodes=[];
let mode='building',preset='assembled',activeView='iso',explode=0,targetExplode=0,manifest,partInfo,ready=false,loading=false,wbpLoaded=0,assetErrors=[],lastTime=0;
const focus=new THREE.Vector3(-18,9,52),grid=new THREE.GridHelper(150,30,0xa6b7a3,0xb7c4b0);grid.position.set(-18,5.1,52);grid.material.transparent=true;grid.material.opacity=.13;scene.add(grid);
function resize(){const w=viewport.clientWidth,h=viewport.clientHeight,span=135;camera.left=-span*w/h/2;camera.right=span*w/h/2;camera.top=span/2;camera.bottom=-span/2;camera.updateProjectionMatrix();renderer.setSize(w,h)}new ResizeObserver(resize).observe(viewport);resize();
function setView(v='iso'){
 activeView=v;const center=mode==='site'?new THREE.Vector3(0,0,0):focus.clone();center.y+=mode==='building'?targetExplode*12:0;
 const directions={iso:new THREE.Vector3(150,140,95),plan:new THREE.Vector3(0,200,.01),front:new THREE.Vector3(-160,30,50)};
 camera.position.copy(center).add(directions[v].multiplyScalar(mode==='site'?12:1));camera.zoom=mode==='site'?.065:(targetExplode>.1?1:1.35);camera.updateProjectionMatrix();controls.target.copy(center);controls.update();document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===v));
}
setView();
function visibleInTree(o){for(let p=o;p;p=p.parent)if(!p.visible)return false;return true}
function applyState(){for(const [id,g]of Object.entries(parts)){g.visible=id==='t1_context'?$('t1').checked:id==='site_extras'?mode==='site':checks[id].checked;g.position.set(0,0,0)}applyDemolition();grid.visible=mode==='building';for(const s of contextStates)if(s.object)s.object.visible=mode==='site'&&(s.group!=='surrounding_buildings'||$('surroundings').checked);$('context-options').hidden=mode!=='site';$('building').classList.toggle('active',mode==='building');$('site').classList.toggle('active',mode==='site')}
function updateCaption(){
 const current=step?demolition?.stages[step-1]:demolition?.initial;
 $('view-title').textContent=current?.title||'WBP demolition sequence';$('view-label').textContent='DEMOLITION / V39';
 $('stage-description').textContent=current?.description||'Preparing the demolition sequence…';
 $('stage-count').textContent=step+' / '+(demolition?.stages.length||47);
 $('explode-value').textContent=Math.round(step/(demolition?.stages.length||47)*100)+'%';
 $('previous-step').disabled=step===0;$('next-step').disabled=step===(demolition?.stages.length||47);
 document.querySelectorAll('[data-preset]').forEach(b=>b.classList.toggle('active',b.dataset.preset===preset));
}
function applyDemolition(){
 if(!demolition)return;
 const done=new Set(demolition.stages.slice(0,step).map(s=>s.controller));
 for(const n of stageNodes){const c=n.userData.demolitionController;const event=demolition.stages.find(s=>s.controller===c);n.visible=!event|| (event.action==='add'?done.has(c):!done.has(c));}
}
function goStep(value){step=Math.max(0,Math.min(demolition?.stages.length||47,Number(value)));$('explode').value=step;applyDemolition();updateCaption();}
function choosePreset(p){preset=p;targetExplode=0;for(const input of Object.values(checks))input.checked=true;if(p==='roof'||p==='inside')checks.roof.checked=false;if(p==='inside'){checks.facade.checked=false;checks.canopy.checked=false}applyState();updateCaption()}
document.querySelectorAll('[data-preset]').forEach(b=>b.onclick=()=>choosePreset(b.dataset.preset));document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>setView(b.dataset.view));
$('explode').oninput=e=>goStep(e.target.value);
$('previous-step').onclick=()=>goStep(step-1);$('next-step').onclick=()=>goStep(step+1);
$('restore').onclick=()=>{choosePreset('assembled');goStep(0)};
$('reset').onclick=()=>{mode='building';$('t1').checked=true;controls.autoRotate=false;$('rotate').classList.remove('active');$('rotate').setAttribute('aria-pressed','false');choosePreset('assembled');goStep(0);setView('iso')};$('fit').onclick=()=>setView(activeView);
$('rotate').onclick=()=>{controls.autoRotate=!controls.autoRotate;$('rotate').classList.toggle('active',controls.autoRotate);$('rotate').setAttribute('aria-pressed',String(controls.autoRotate))};
$('building').onclick=()=>{mode='building';applyState();updateCaption();setView('iso')};$('site').onclick=()=>{mode='site';applyState();updateCaption();setView('iso');loadContext()};$('t1').onchange=applyState;$('surroundings').onchange=applyState;
function prepare(o){o.traverse(m=>{if(m.isMesh){for(const mat of Array.isArray(m.material)?m.material:[m.material])for(const key of ['map','normalMap'])if(mat[key])mat[key].anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy())}})}
async function loadBuilding(){
 const url=demolition.asset;if(scene.userData[url])return;
 try{ $('status').textContent='Loading V39 components and materials…';const gltf=await loader.loadAsync(url);prepare(gltf.scene);gltf.scene.updateMatrixWorld(true);
 const nodes=[];gltf.scene.traverse(o=>{if(o.userData.demolitionController&&o.parent?.userData.demolitionController!==o.userData.demolitionController)nodes.push(o)});
 for(const node of nodes){const id=node.userData.wbpPart;if(!parts[id])throw Error('Unknown part '+id);parts[id].attach(node);stageNodes.push(node);node.traverse(o=>{if(o.isMesh){o.userData.part=id;if(node.userData.demolitionController.startsWith('ANIM_Protect_Lift_'))for(const m of Array.isArray(o.material)?o.material:[o.material]){m.opacity=1;m.transparent=false;m.depthWrite=true;m.needsUpdate=true;}}});}
 scene.userData[url]=true;wbpLoaded=1;ready=true;applyState();updateCaption();
 }catch(e){assetErrors.push({url,error:String(e)});console.error(e)}showStatus();
}
function showStatus(){const bad=assetErrors.length>0;$('retry').hidden=!bad;$('status').textContent=bad?'Some components could not load. Please retry.':!ready?'Loading WBP…':mode==='site'&&contextStates.some(s=>!s.object)?'WBP ready · Loading airport context':'WBP model ready'}
async function loadContext(){if(loading||!manifest)return;loading=true;try{for(const s of contextStates){if(s.object||mode!=='site')continue;try{const gltf=await loader.loadAsync(s.url);s.object=gltf.scene;prepare(s.object);scene.add(s.object);applyState()}catch(e){assetErrors.push({url:s.url,error:String(e)});console.error(e)}showStatus()}}finally{loading=false;showStatus()}}
$('retry').onclick=async()=>{assetErrors=[];await loadBuilding();if(mode==='site')loadContext()};
try{const results=await Promise.all([fetch('./manifest.json'),fetch('./demolition.json')]);if(results.some(r=>!r.ok))throw Error('Could not load the model manifest');[manifest,demolition]=await Promise.all(results.map(r=>r.json()));$('explode').max=demolition.stages.length;updateCaption();contextStates.push(...manifest.layers.filter(l=>!['target_building','building_details','source_reference'].includes(l.group)).map(l=>({...l,object:null})));await loadBuilding();if(mode==='site')loadContext()}catch(e){assetErrors.push({error:String(e)});showStatus();console.error(e)}
const ray=new THREE.Raycaster(),pointer=new THREE.Vector2();let down,hoverPart=null,lastHover=0;
function intersect(e){const r=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,1-(e.clientY-r.top)/r.height*2);ray.setFromCamera(pointer,camera);const roots=[...Object.values(parts),...contextStates.filter(s=>s.object).map(s=>s.object)].filter(o=>o.visible);return ray.intersectObjects(roots,true).find(h=>visibleInTree(h.object))}
renderer.domElement.addEventListener('pointerdown',e=>{down=[e.clientX,e.clientY]});renderer.domElement.addEventListener('pointerup',e=>{if(!down||!ready||Math.hypot(e.clientX-down[0],e.clientY-down[1])>5)return;const hit=intersect(e);if(!hit)return;const id=hit.object.userData.part;const p=hit.point.clone();if(id){let n=hit.object;while(n&&!n.userData.explodeVector)n=n.parent;if(n)p.add(n.userData.restPosition).sub(n.position);}const o=manifest.origin;$('position').textContent=`${config[id]?.label||'Site'} · Original HK1980 E ${(p.x+o.easting).toFixed(2)} / N ${(o.northing-p.z).toFixed(2)} / H ${p.y.toFixed(2)} m`;});
renderer.domElement.addEventListener('pointermove',e=>{if(e.buttons||performance.now()-lastHover<120)return;lastHover=performance.now();const h=intersect(e),id=h?.object.userData.part;hoverPart=id||null;$('hover-label').hidden=!id;if(id){const r=viewport.getBoundingClientRect();$('hover-label').textContent=config[id].label;$('hover-label').style.left=Math.min(e.clientX-r.left+14,r.width-180)+'px';$('hover-label').style.top=(e.clientY-r.top+14)+'px'}});renderer.domElement.addEventListener('pointerleave',()=>{$('hover-label').hidden=true});
renderer.setAnimationLoop(t=>{const dt=Math.min((t-lastTime)/1000,.05);lastTime=t;if(Math.abs(explode-targetExplode)>.0001){explode=THREE.MathUtils.damp(explode,targetExplode,8,dt);if(Math.abs(explode-targetExplode)<.0001)explode=targetExplode;applyState()}controls.update();const north=new THREE.Vector3(0,0,-1).applyQuaternion(camera.quaternion.clone().invert());$('north-arrow').style.transform=`rotate(${Math.atan2(north.x,north.y)}rad)`;renderer.render(scene,camera)});
const diagnostics=document.createElement('script');diagnostics.type='application/json';diagnostics.id='viewer-diagnostics';document.body.appendChild(diagnostics);setInterval(()=>{diagnostics.textContent=JSON.stringify({ready,mode,preset,step,totalSteps:demolition?.stages.length,stageTitle:$('view-title').textContent,visibleGroups:stageNodes.filter(n=>n.visible).length,hiddenControllers:[...new Set(stageNodes.filter(n=>!n.visible).map(n=>n.userData.demolitionController))],addedProtection:stageNodes.filter(n=>n.visible&&n.userData.demolitionController.startsWith('ANIM_Protect_Lift_')).length,explode,targetExplode,wbpLoaded,errors:assetErrors,parts:Object.fromEntries(Object.entries(parts).map(([k,v])=>[k,{visible:v.visible,offset:v.position.toArray(),children:v.children.length}])),directions:movingNodes.map(n=>({part:n.userData.wbpPart,direction:n.userData.explodeDirection,offset:n.position.clone().sub(n.userData.restPosition).toArray()})),contextLoaded:contextStates.filter(s=>s.object).length,contextTotal:contextStates.length,camera:camera.position.toArray(),drawCalls:renderer.info.render.calls})},500);





