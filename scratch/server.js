const http=require('http'), fs=require('fs'), path=require('path');
const dir=__dirname;
http.createServer((req,res)=>{
  let f=decodeURIComponent(req.url.split('?')[0]); if(f==='/')f='/index.html';
  const p=path.join(dir,f);
  fs.readFile(p,(e,d)=>{ if(e){res.writeHead(404);res.end('nf');return;}
    const ext=path.extname(p); const mt=ext==='.html'?'text/html':'application/octet-stream';
    res.writeHead(200,{'Content-Type':mt}); res.end(d); });
}).listen(8791,()=>console.log('serving on 8791'));
