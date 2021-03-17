const http= require('http');

const server=http.createServer((req,resp)=>{
    const url=req.url;
    const method=req.method;
    if(url==='/'){
        resp.setHeader('Content-Type', 'text/html');
        resp.write("<html>")    
        resp.write("<body><h1>Hello Node JS</h1><form action='/createuser' method='post'><input type='text' name='username'><button type='submit'>Submit</button></form></body>")
        resp.write("</html>")
        resp.end;
    }
    if(url==='/users'){
        resp.setHeader('Content-Type', 'text/html');
        resp.write("<html>")    
        resp.write("<body><ul><li>User 1</li><li>User 2</li></ul></body>")
        resp.write("</html>")
        resp.end;
    }
    if(url==='/createuser'){
        const body=[];
        req.on('data',(chunk)=>{
            body.push(chunk);
        });
        req.on('end',()=>{
            const parsedBody = Buffer.concat(body).toString();
            console.log(parsedBody.split('=')[1]);
        });        
        resp.statusCode=302;
        resp.setHeader('Location','/');
        resp.end();
    }
});

server.listen(3000);

