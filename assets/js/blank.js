// 빈칸 문제 엔진. 페이지에 window.QUIZ = {key, answers, sections} 가 있어야 합니다.
// 코드 문자열에서 [[n]] 자리가 빈칸, # 뒤는 주석으로 표시됩니다.
(function(){
const Q=window.QUIZ; if(!Q) return;
const A=Q.answers, S=Q.sections, KEY=Q.key;

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

const inputs=[...document.querySelectorAll('.blank input')];
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
  if(saved[inp.dataset.n]) inp.value=saved[inp.dataset.n];
  inp.addEventListener('input',()=>{
    saved[inp.dataset.n]=inp.value; save();
    inp.parentElement.classList.remove('ok','bad'); progress();
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
