require('dotenv').config({path:require('path').join(__dirname,'..','.env')});
const http = require('http');
const API = 'http://localhost:5000/api';
function fetchUrl(url, opts, timeout) {
  return new Promise(function(resolve) {
    if (!timeout) timeout = 10000;
    var timedOut = false;
    var timer = setTimeout(function() { timedOut = true; resolve({ok:false, error:'TIMEOUT after '+timeout+'ms', elapsed:timeout}); }, timeout);
    var start = Date.now();
    var parsed = new URL(url);
    var options = {
      hostname: parsed.hostname, port: parsed.port,
      path: parsed.pathname + parsed.search,
      method: opts.method || 'GET',
      headers: opts.headers || {'Content-Type': 'application/json'},
    };
    var req = http.request(options, function(res) {
      var data = '';
      res.on('data', function(c) { data += c; });
      res.on('end', function() {
        if (timedOut) return; clearTimeout(timer);
        try { var json = JSON.parse(data); resolve({ok:true,elapsed:Date.now()-start, success:json.success,data:json.data,message:json.message,json:json}); }
        catch(e) { resolve({ok:true,elapsed:Date.now()-start,raw:data}); }
      });
    });
    req.on('error', function(e) {
      if (timedOut) return; clearTimeout(timer);
      resolve({ok:false,error:e.message,elapsed:Date.now()-start});
    });
    if (opts.body) req.write(opts.body);
    req.end();
  });
}
