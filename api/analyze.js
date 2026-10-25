import {createHash} from 'node:crypto';
import {MODEL,SYSTEM,validateInput,validateAnalysis} from '../server/analysis.js';
const cache=new Map(),limits=new Map();
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
 if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).json({error:'POSTのみ利用できます。'})}
 if(req.headers.origin&&req.headers.origin!==`https://${req.headers.host}`)return res.status(403).json({error:'サイトから解析を開始してください。'});
 let input;try{input=validateInput(typeof req.body==='string'?JSON.parse(req.body):req.body)}catch{return res.status(400).json({error:'名前80文字以内、設定1800文字以内で入力してください。'})}
 const now=Date.now(),key=createHash('sha256').update(JSON.stringify(input)).digest('hex');
 for(const [k,v] of cache)if(v.until<now)cache.delete(k);for(const [k,v] of limits)if(v.until<now)limits.delete(k);
 if(cache.has(key))return res.status(200).json({...cache.get(key).data,cached:true});
 const ip=String(req.headers['x-forwarded-for']||'unknown').split(',')[0],id=createHash('sha256').update(ip).digest('hex');const quota=limits.get(id)||{n:0,until:now+3600000};if(quota.n>=12){res.setHeader('Retry-After','3600');return res.status(429).json({error:'解析が集中しています。時間を置いて再試行してください。'})}quota.n++;limits.set(id,quota);
 const token=process.env.AI_GATEWAY_API_KEY||req.headers['x-vercel-oidc-token']||process.env.VERCEL_OIDC_TOKEN;
 if(!token)return res.status(503).json({error:'AI接続の設定が未完了です。簡易算出は引き続き利用できます。',code:'AI_NOT_CONFIGURED'});
 try{
  const response=await fetch('https://ai-gateway.vercel.sh/v1/chat/completions',{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},signal:AbortSignal.timeout(25000),body:JSON.stringify({model:MODEL,temperature:.4,max_tokens:2200,response_format:{type:'json_object'},messages:[{role:'system',content:SYSTEM},{role:'user',content:JSON.stringify(input)}]})});
  if(!response.ok){const status=response.status;return res.status(503).json({error:status===402||status===403?'AI Gatewayの利用枠またはアカウント確認が必要です。簡易算出は利用できます。':status===401?'AI認証を確認できませんでした。簡易算出は利用できます。':'AIが混雑しています。しばらくして再試行してください。',code:status===402||status===403?'AI_ACCOUNT_REQUIRED':status===401?'AI_AUTH':'AI_UNAVAILABLE'});}
  const raw=await response.json();const data={...validateAnalysis(JSON.parse(raw.choices?.[0]?.message?.content)),model:MODEL,source:'ai',input,version:1};
  if(cache.size>=100)cache.delete(cache.keys().next().value);cache.set(key,{until:now+3600000,data});return res.status(200).json(data);
 }catch{return res.status(503).json({error:'AI解析を完了できませんでした。再試行するか、簡易算出で観測を開始できます。',code:'AI_RETRY'})}
}
