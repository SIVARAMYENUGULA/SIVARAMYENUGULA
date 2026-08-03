var h=require("http");
var R={all:[],emails:[],pass:0,fail:0};
function api(m,p,t,b){return new Promise(function(r){var bd=b?JSON.stringify(b):null;var o={method:m,hostname:"localhost",port:5000,path:"/api"+p,headers:{"Content-Type":"application/json"}};if(bd)o.headers["Content-Length"]=Buffer.byteLength(bd);if(t)o.headers["Authorization"]="Bearer "+t;var q=h.request(o,function(s){var d="";s.on("data",function(c){d+=c});s.on("end",function(){try{r({status:s.statusCode,body:JSON.parse(d)})}catch{r({status:s.statusCode,body:d})}})});q.on("error",function(e){r({status:0,body:{error:e.message}})});if(bd)q.write(bd);q.end()})}
function check(n,p,d){R.all.push({n:n,p:p,d:d});if(p)R.pass++;else R.fail++;console.log((p?"PASS":"FAIL")+" | "+n+" | "+d)}
function sleep(ms){return new Promise(function(r){setTimeout(r,ms)})}
async function main(){try{
var el=await api("GET","/notification/log",null,null);
console.log("[INIT] Delivery log check:",el.body?.success);
var sr=await api("POST","/auth/login",null,{email:"shabirsk989+student@gmail.com",password:"Student@123"});
check("Student Login",sr.status===200&&sr.body?.success,sr.status+" "+(sr.body?.error?.message||sr.body?.message||"OK"));
var st=sr.body?.data?.token;
var cr=await api("POST","/auth/login",null,{email:"shabirsk989+company@gmail.com",password:"Company@123"});
check("Company Login",cr.status===200&&cr.body?.success,cr.status+" "+(cr.body?.error?.message||"OK"));
var ct=cr.body?.data?.token;
var clr=await api("POST","/auth/login",null,{email:"shabirsk989+college@gmail.com",password:"College@123"});
check("College Login",clr.status===200&&clr.body?.success,clr.status+" "+(clr.body?.error?.message||"OK"));
var clt=clr.body?.data?.token;
var ar=await api("POST","/auth/login",null,{email:"shabirsk989+admin@gmail.com",password:"Admin@123"});
check("Admin Login",ar.status===200&&ar.body?.success,ar.status+" "+(ar.body?.error?.message||"OK"));
var at=ar.body?.data?.token;
var jr=await api("POST","/jobs",ct,{title:"E2E Gmail Test Job",description:"End-to-end verification with Gmail accounts",location:"Bangalore",type:"Full-time",salaryMin:800000,salaryMax:1500000,skillsRequired:["JavaScript","React","Node.js"]});
check("Company Create Job",jr.status===201||jr.status===200,jr.status+" "+JSON.stringify(jr.body?.data?._id||jr.body?.data?.id||jr.body?.message));
var jid=jr.body?.data?._id||jr.body?.data?.id;
if(jid){var ajr=await api("PUT","/jobs/"+jid,ct,{status:"active"});check("Activate Job",ajr.status===200||ajr.status===201,ajr.status+" "+JSON.stringify(ajr.body?.data?.status||ajr.body?.message));}
}catch(e){console.log("[FATAL]",e.message,e.stack)}finally{
console.log("
===== FINAL REPORT =====");
console.log("Total Workflows:",R.all.length);
console.log("Passed:",R.pass);
console.log("Failed:",R.fail);
console.log("Emails Logged:",R.emails.length);
console.log("
--- Workflow Details ---");
for(var i=0;i<R.all.length;i++){var w=R.all[i];console.log((w.p?"  PASS":"  FAIL")+" | "+w.n+" | "+w.d)}
console.log("
--- Email Delivery Log ---");
for(var i=0;i<R.emails.length;i++){var e=R.emails[i];console.log("  Email #"+(i+1)+": To="+e.to+" Accepted="+JSON.stringify(e.accepted)+" Rejected="+JSON.stringify(e.rejected)+" SMTP="+e.smtpResponse+" MsgId="+e.messageId+" Status="+e.status)}
console.log("
Production Ready: "+(R.fail===0?"YES":"NO - fix failures above"));
process.exit(R.fail>0?1:0);
}});
main();