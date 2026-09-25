import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const port=Number(process.env.PORT||4173);
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json','.webmanifest':'application/manifest+json','.md':'text/plain; charset=utf-8','.svg':'image/svg+xml','.png':'image/png'};
const server=http.createServer(async(req,res)=>{
  try {
    const url=new URL(req.url,'http://localhost');
    const rel=decodeURIComponent(url.pathname).replace(/^\/+/, '');
    if(rel.split('/').some(segment=>segment.startsWith('.'))){res.writeHead(403).end();return;}
    let target=path.resolve(root,rel||'index.html');
    if(!target.startsWith(root)){res.writeHead(403).end();return;}
    if((await stat(target)).isDirectory())target=path.join(target,'index.html');
    const content=await readFile(target);
    res.writeHead(200,{'Content-Type':mime[path.extname(target)]||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
    res.end(content);
  }catch{res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});res.end('Filen finns inte.');}
});
server.listen(port,'127.0.0.1',()=>console.log(`Skärbrädeverkstan: http://127.0.0.1:${port}`));
