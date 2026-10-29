// 빈칸 문제 엔진. 페이지에 window.QUIZ = {key, answers, sections} 가 있어야 합니다.
// 코드 문자열에서 [[n]] 자리가 빈칸, # 뒤는 주석으로 표시됩니다.
// 기본은 보기 4개 중 고르기(객관식), '직접 입력'으로 바꾸면 손코딩처럼 직접 칩니다.
(function(){
const Q=window.QUIZ; if(!Q) return;
const A=Q.answers, S=Q.sections, KEY=Q.key;
let MODE='pick'; try{MODE=localStorage.getItem(KEY+'-mode')||'pick'}catch(e){}

// 보기 만들기: 같은 문제 → 같은 챕터 → 전체 빈칸의 정답 중에서 생김새가 비슷한 것을 오답으로 고름
const kind=v=>/^\d+$/.test(v)?'num':/^[A-Za-z_][\w.]*$/.test(v)?(/^[A-Z]/.test(v)?'Cap':'id'):'sym';
const order={}; const groups=[];
S.forEach(sec=>{const g=[];sec.items.forEach(it=>{const ns=[...it.code.matchAll(/\[\[(\d+)\]\]/g)].map(m=>m[1]);ns.forEach(n=>order[n]={item:ns,sec:g});g.push(...ns)});groups.push(g)});
const all=Object.keys(A);
function rnd(seed){let x=seed*2654435761%4294967296;return()=>(x=(x*1664525+1013904223)%4294967296)/4294967296}
function choices(n){
  const right=A[n][0], bad=new Set(A[n].map(v=>v.trim())), k=kind(right), r=rnd(+n+7);
  const pick=[];
  const tryAdd=(list,any)=>{
    const c=[...new Set(list.map(m=>A[m][0].trim()))].filter(v=>!bad.has(v)&&!pick.includes(v));
    const same=c.filter(v=>kind(v)===k), other=c.filter(v=>kind(v)!==k);
    for(const pool of [same,other]){ while(pool.length&&pick.length<3){ pick.push(pool.splice(Math.floor(r()*pool.length),1)[0]); } if(!any||pick.length>=3) break; }
  };
  const o=order[n]||{item:[],sec:[]};
  tryAdd(o.item); if(pick.length<3) tryAdd(o.sec); if(pick.length<3) tryAdd(all); if(pick.length<3) tryAdd(all,true);
  const out=[right,...pick];
  for(let i=out.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[out[i],out[j]]=[out[j],out[i]]}
  return out;
}

let saved={};
try{saved=JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch(e){saved={}}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(saved))}catch(e){}};

const esc=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
function renderLine(line){
  // 주석 분리 (문자열 안의 #은 없다고 가정)
  let code=line,cm='';
  const k=line.indexOf('#');
  if(k>=0){code=line.slice(0,k);cm=line.slice(k);}
  let html=esc(code).replace(/\[\[(\d+)\]\]/g,(m,n)=>{
    const w=Math.max(5,A[n][0].length+2);
    if(MODE==='pick'){
      const cs=choices(n);
      return `<span class="blank" data-n="${n}"><span class="no">${n}</span><select aria-label="빈칸 ${n}" data-n="${n}"><option value="">선택</option>${cs.map(c=>`<option>${esc(c)}</option>`).join('')}</select><span class="ans">${esc(A[n].join(' / '))}</span></span>`;
    }
    return `<span class="blank" data-n="${n}"><span class="no">${n}</span><input aria-label="빈칸 ${n}" spellcheck="false" autocapitalize="off" autocomplete="off" autocorrect="off" style="width:${w}ch" data-n="${n}"><span class="ans">${esc(A[n].join(' / '))}</span></span>`;
  });
  if(cm) html+=`<span class="cm">${esc(cm)}</span>`;
  return html;
}

const quiz=document.getElementById('quiz');
let qn=0;
S.forEach(sec=>{
  const s=document.createElement('section'); s.id=sec.id;
  s.innerHTML=`<h2>${esc(sec.title)}</h2>`;
  sec.items.forEach(({desc,code,hints})=>{
    qn++;
    const d=document.createElement('div'); d.className='q';
    // hints: [[빈칸 번호, 뜻], ...] 가 있으면 힌트 버튼
    const hb=hints&&hints.length?`<button type="button" class="hint-btn" aria-expanded="false">힌트</button>`:'';
    const hl=hb?`<ol class="hints" hidden>${hints.map(([n,m])=>`<li><b>${n}</b>${esc(m)}</li>`).join('')}</ol>`:'';
    d.innerHTML=`<p><span>${qn}</span>${esc(desc)}${hb}</p><pre>${code.split('\n').map(renderLine).join('\n')}</pre>${hl}`;
    s.appendChild(d);
  });
  quiz.appendChild(s);
});

quiz.addEventListener('click',e=>{
  const b=e.target.closest('.hint-btn'); if(!b) return;
  const l=b.closest('.q').querySelector('.hints'); l.hidden=!l.hidden; b.setAttribute('aria-expanded',!l.hidden);
});

// 보기 고르기 / 직접 입력 전환
const sw=document.createElement('div'); sw.className='seg mode-seg'; sw.setAttribute('role','group'); sw.setAttribute('aria-label','풀이 방식');
sw.innerHTML=`<button type="button" data-m="pick" aria-pressed="${MODE==='pick'}">보기 고르기</button><button type="button" data-m="type" aria-pressed="${MODE==='type'}">직접 입력 (손코딩 연습)</button>`;
quiz.before(sw);
sw.onclick=e=>{const b=e.target.closest('button'); if(!b||b.dataset.m===MODE) return; try{localStorage.setItem(KEY+'-mode',b.dataset.m)}catch(err){} location.reload();};

const inputs=[...document.querySelectorAll('.blank input, .blank select')];
const scoreEl=document.getElementById('score');
const idle=()=>{scoreEl.innerHTML=`채점 전 · 빈칸 <b>${inputs.length}</b>개`};
idle();
const norm=v=>v.trim().replace(/^['"]|['"]$/g,'').replace(/\s+/g,'').replace(/\(\)$/,'');
const isOk=inp=>A[inp.dataset.n].some(a=>norm(a)===norm(inp.value));

function progress(){
  const filled=inputs.filter(i=>i.value.trim()).length;
  document.getElementById('prog').style.width=(filled/inputs.length*100)+'%';
}
inputs.forEach((inp,i)=>{
  if(saved[inp.dataset.n]){
    if(inp.tagName==='SELECT'){ const o=[...inp.options].find(o=>norm(o.value)===norm(saved[inp.dataset.n])); if(o) inp.value=o.value; }
    else inp.value=saved[inp.dataset.n];
  }
  inp.addEventListener('input',()=>{
    saved[inp.dataset.n]=inp.value; save();
    inp.parentElement.classList.remove('ok','bad');
    // 보기 고르기는 고르자마자 맞았는지 표시
    if(inp.tagName==='SELECT'&&inp.value) inp.parentElement.classList.add(isOk(inp)?'ok':'bad');
    progress();
  });
  inp.addEventListener('keydown',e=>{
    if(e.key==='Enter'){e.preventDefault(); const nx=inputs[i+1]; if(nx) nx.focus(); else document.getElementById('grade').focus();}
  });
});
progress();

let graded=false;
function grade(){
  let ok=0;
  inputs.forEach(inp=>{
    const b=inp.parentElement, good=isOk(inp);
    b.classList.toggle('ok',good); b.classList.toggle('bad',!good);
    if(good) ok++;
  });
  document.querySelectorAll('.q').forEach(q=>{
    q.classList.toggle('allok',[...q.querySelectorAll('.blank')].every(b=>b.classList.contains('ok')));
  });
  const pct=Math.round(ok/inputs.length*100);
  scoreEl.innerHTML=`<b>${ok}</b> / ${inputs.length} 정답 (${pct}%)`;
  graded=true;
}
document.getElementById('grade').onclick=()=>{
  grade();
  const first=document.querySelector('.blank.bad');
  if(first) first.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'center'});
};
const wrongBtn=document.getElementById('wrong');
wrongBtn.onclick=()=>{
  if(!graded) grade();
  const on=document.body.classList.toggle('only-wrong');
  wrongBtn.setAttribute('aria-pressed',on);
};
const revBtn=document.getElementById('reveal');
revBtn.onclick=()=>{
  const on=document.body.classList.toggle('reveal');
  revBtn.setAttribute('aria-pressed',on);
};
document.getElementById('reset').onclick=()=>{
  if(!confirm('입력한 답을 모두 지울까요?')) return;
  saved={}; save();
  inputs.forEach(i=>{i.value='';i.parentElement.classList.remove('ok','bad')});
  document.querySelectorAll('.q').forEach(q=>q.classList.remove('allok'));
  document.body.classList.remove('only-wrong','reveal');
  wrongBtn.setAttribute('aria-pressed','false'); revBtn.setAttribute('aria-pressed','false');
  idle(); graded=false; progress(); window.scrollTo(0,0);
};
})();
