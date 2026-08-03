const API='http://localhost:5000/api';
const res=[],dns=require('dns').promises;
function r(wf,rec,gen,smtp,err){res.push({wf,rec:rec||'N/A',gen:gen?'Yes':'No',smtp:smtp?'Yes':'No',err:err||''});const p=gen&&smtp;console.log('  '+(p?'PASS':'FAIL')+' | '+wf.padEnd(42)+' | '+(rec||'N/A').padEnd(30)+(err?' | '+err:''));}
async function main(){
  console.log('COMPREHENSIVE E2E EMAIL VALIDATION');
  try{const e=require('./src/config/env'),n=require('nodemailer'),t=n.createTransport({service:'gmail',auth:{user:e.smtpUser,pass:e.smtpPass}});await t.verify();const i=await t.sendMail({from:e.smtpFrom||'"PlaceMux" <noreply@placemux.com>',to:'shabirsk989+test@gmail.com',subject:'SMTP Direct Test',text:'Direct SMTP test'});const ok=i.accepted&&i.accepted.length>0;console.log('SMTP Direct: '+(ok?'PASS: '+i.messageId:'FAIL'));if(!ok)console.log('Rejected:'+JSON.stringify(i.rejected));}catch(e){console.log('SMTP Direct FAIL:'+e.message);}
  console.log('Done');
}
main().catch(e=>console.error(e));