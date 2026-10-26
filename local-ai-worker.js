import {pipeline,env} from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/dist/transformers.min.js';
env.allowLocalModels=false;env.backends.onnx.wasm.numThreads=1;
let classifier;
const model='Xenova/mDeBERTa-v3-base-xnli-multilingual-nli-2mil7';
const groups=[['This fictional phenomenon is harmless and helps people feel happy and peaceful.','This fictional phenomenon causes trouble and disrupts daily life.','This fictional phenomenon causes severe suffering and destroys society.'],['The effect is restricted to one small place.','The effect gradually spreads across several regions.','The effect reaches the entire world.'],['The phenomenon changes dreams, memories, and emotions.','The phenomenon changes light, crystals, matter, or landscapes.','The phenomenon changes time and clocks.']];
self.onmessage=async({data})=>{try{if(!classifier)classifier=await pipeline('zero-shot-classification',model,{dtype:'q8',device:'wasm',progress_callback:p=>{if(p.status==='progress')self.postMessage({type:'progress',text:`モデルを読み込み中 · ${Math.round(p.progress||0)}%`});else if(p.status==='initiate')self.postMessage({type:'progress',text:'初回モデル取得中（約300MB）。しばらくお待ちください。'});}});
const input=data.input;const premise=input.lore||input.name;const scores=[];
for(let i=0;i<groups.length;i++){self.postMessage({type:'progress',text:`文章の意味を端末内で推論中 · ${i+1} / 3`});const out=await classifier(premise,groups[i],{multi_label:false,hypothesis_template:'{}'});scores.push(groups[i].map(label=>out.scores[out.labels.indexOf(label)]));}
self.postMessage({type:'result',input,scores,model});}catch(e){self.postMessage({type:'error',error:'端末AIを実行できませんでした。通信環境・空きメモリを確認し、再試行してください。'})}};
