import {pipeline,env} from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/dist/transformers.min.js';
env.allowLocalModels=false;env.backends.onnx.wasm.numThreads=1;
let classifier;
const model='onnx-community/multilingual-MiniLMv2-L6-mnli-xnli-ONNX';
const groups=[['人々を傷つけず、癒しや安心、調和をもたらす。','人々の生活を変え、混乱や負担を生む。','社会の仕組みを大きく崩壊させ、深刻な混乱を生む。'],['影響は限られた場所や条件にとどまる。','影響は徐々に複数の地域へ広がる。','影響は地球全体へ大きく広がる。'],['夢、記憶、感情や人々の心が変化する。','光、結晶、物質や景観が変化する。','時間、時計や時間感覚が変化する。']];
self.onmessage=async({data})=>{try{if(!classifier)classifier=await pipeline('zero-shot-classification',model,{dtype:'q8',device:'wasm',progress_callback:p=>{if(p.status==='progress')self.postMessage({type:'progress',text:`モデルを読み込み中 · ${Math.round(p.progress||0)}%`});else if(p.status==='initiate')self.postMessage({type:'progress',text:'初回モデル取得中（約130MB）。しばらくお待ちください。'});}});
const input=data.input;const premise=`この架空の存在の設定：${input.lore||'詳しい設定はない。'}\n名前：${input.name}`;const scores=[];
for(let i=0;i<groups.length;i++){self.postMessage({type:'progress',text:`文章の意味を端末内で推論中 · ${i+1} / 3`});const out=await classifier(premise,groups[i],{multi_label:false,hypothesis_template:'{}'});scores.push(groups[i].map(label=>out.scores[out.labels.indexOf(label)]));}
self.postMessage({type:'result',input,scores,model});}catch(e){self.postMessage({type:'error',error:'端末AIを実行できませんでした。通信環境・空きメモリを確認し、再試行してください。'})}};
