import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('.',import.meta.url)),port=Number(process.env.PORT||4173);
const types={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.glb':'model/gltf-binary','.gltf':'model/gltf+json','.wasm':'application/wasm','.png':'image/png','.jpg':'image/jpeg','.ktx2':'image/ktx2'};
http.createServer(async(req,res)=>{try{const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname),path=resolve(root,'.'+(pathname==='/'?'/index.html':pathname));if(!path.startsWith(root)||['source','reports'].includes(path.slice(root.length).split(sep)[0])){res.writeHead(403).end();return}const s=await stat(path);if(!s.isFile())throw Error('not file');res.writeHead(200,{'Content-Type':types[extname(path)]||'application/octet-stream','Content-Length':s.size,'Cache-Control':'no-cache'});res.end(await readFile(path))}catch{res.writeHead(404).end('Not found')}}).listen(port,'127.0.0.1',()=>console.log(`AAT viewer ready: http://127.0.0.1:${port}`));
