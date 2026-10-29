// 문제 엔진. 페이지에 window.QUIZ = {key, sections:[{id,title,items:[{q,a,choices?,answer?}]}]} 가 있어야 합니다.
// choices가 있으면 객관식: 보기를 누르면 바로 채점하고 해설(a)을 보여 줍니다.
// fields가 있으면 계산 문제: 숫자를 적고 확인하면 칸마다 채점하고 풀이(steps)를 보여 줍니다.
// 셋 다 없으면 주관식: 답을 적고(선택) 정답을 확인한 뒤 스스로 맞음/틀림을 표시합니다.
(function(){
const Q=window.QUIZ; if(!Q) return;
const KEY=Q.key;

let saved={notes:{},marks:{},picks:{},calc:{}};
try{const s=JSON.parse(localStorage.getItem(KEY)||'null'); if(s&&s.notes&&s.marks) saved=Object.assign(saved,s)}catch(e){}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(saved))}catch(e){}};

const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

const quiz=document.getElementById('quiz');
let qn=0;
Q.sections.forEach(sec=>{
  const s=document.createElement('section'); s.id=sec.id;
  s.innerHTML=`<h2>${esc(sec.title)}</h2>`;
  sec.items.forEach(({q,a,choices,answer,fields,steps})=>{
    const n=++qn;
    const d=document.createElement('div'); d.className='q qa'; d.dataset.n=n;
    if(fields){
      d.classList.add('calc'); const v=saved.calc[n]||[];
      d.innerHTML=`<p><span>${n}</span>${esc(q)}</p>
<div class="qa-body">
  <div class="calc-fields">${fields.map((f,i)=>`<label><span>${esc(f.l)} =</span><input inputmode="decimal" autocomplete="off" spellcheck="false" data-i="${i}" data-v="${f.v}" value="${esc(v[i]||'')}" aria-label="${n}번 ${esc(f.l)}"><em>${esc(String(f.v).replace('-','−'))}</em></label>`).join('')}</div>
  <div class="qa-row"><button type="button" class="check primary">확인</button><button type="button" class="steps-btn" aria-expanded="false" hidden>풀이 보기</button></div>
  <div class="qa-ans steps" hidden><b>풀이</b><ol>${steps.map(t=>`<li>${esc(t)}</li>`).join('')}</ol></div>
</div>`;
      s.appendChild(d); return;
    }
    if(choices){
      d.classList.add('mc'); d.dataset.answer=answer;
      d.innerHTML=`<p><span>${n}</span>${esc(q)}</p>
<div class="qa-body">
  <ol class="mc-opts">${choices.map((c,i)=>`<li><button type="button" data-i="${i}"><b>${'①②③④⑤'[i]}</b>${esc(c)}</button></li>`).join('')}</ol>
  <div class="qa-ans" hidden><b>해설</b> ${esc(a)}</div>
  ${steps?`<div class="qa-row"><button type="button" class="steps-btn" aria-expanded="false" hidden>풀이 보기</button></div><div class="qa-ans steps" hidden><b>풀이</b><ol>${steps.map(t=>`<li>${esc(t)}</li>`).join('')}</ol></div>`:''}
</div>`;
      s.appendChild(d); return;
    }
    d.innerHTML=`<p><span>${n}</span>${esc(q)}</p>
<div class="qa-body">
  <textarea rows="2" placeholder="내 답 (선택)" aria-label="${n}번 내 답" spellcheck="false">${esc(saved.notes[n]||'')}</textarea>
  <div class="qa-row">
    <button type="button" class="show" aria-expanded="false">정답 보기</button>
    <button type="button" class="mark ok" aria-pressed="false">○ 맞음</button>
    <button type="button" class="mark bad" aria-pressed="false">× 틀림</button>
  </div>
  <div class="qa-ans" hidden><b>정답</b> ${esc(a)}</div>
</div>`;
    s.appendChild(d);
  });
  quiz.appendChild(s);
});

const cards=[...document.querySelectorAll('.q.qa')];
const total=cards.length;
const scoreEl=document.getElementById('score');

// 풀이 보기 버튼: 답을 낸 뒤(또는 정답 모두 보기)에만 나타나고, 눌러야 풀이가 펼쳐짐
function paintSteps(card,done){
  const b=card.querySelector('.steps-btn'); if(!b) return;
  const all=card.classList.contains('show-ans'), open=all||card.classList.contains('steps-open');
  b.hidden=!(done||all);
  b.setAttribute('aria-expanded',open); b.textContent=open?'풀이 숨기기':'풀이 보기';
  card.querySelector('.qa-ans.steps').hidden=!open;
}
function paint(card){
  const n=card.dataset.n, m=saved.marks[n];
  card.classList.toggle('marked-ok',m==='ok');
  card.classList.toggle('marked-bad',m==='bad');
  card.classList.toggle('allok',m==='ok');
  if(card.classList.contains('calc')){
    card.querySelectorAll('.calc-fields input').forEach(inp=>{
      const done=m!==undefined;
      inp.parentElement.classList.toggle('ok',done&&numOk(inp));
      inp.parentElement.classList.toggle('bad',done&&!numOk(inp));
    });
    paintSteps(card,m!==undefined);
    return;
  }
  if(card.classList.contains('mc')){
    const pick=saved.picks[n], ans=+card.dataset.answer, done=pick!==undefined, show=done||card.classList.contains('show-ans');
    card.querySelectorAll('.mc-opts button').forEach(b=>{
      const i=+b.dataset.i;
      b.classList.toggle('right',show&&i===ans);
      b.classList.toggle('wrong',done&&i===pick&&i!==ans);
      b.setAttribute('aria-pressed',done&&i===pick);
      b.disabled=done;
    });
    card.querySelector('.qa-ans').hidden=!show;
    paintSteps(card,done);
    return;
  }
  card.querySelector('.mark.ok').setAttribute('aria-pressed',m==='ok');
  card.querySelector('.mark.bad').setAttribute('aria-pressed',m==='bad');
}
// 숫자 비교: −, 쉼표, 분수(1/2) 허용, 소수 둘째 자리까지 맞으면 정답
function num(v){
  v=String(v).trim().replace(/[−–]/g,'-').replace(/,/g,'').replace(/\s+/g,'');
  const f=v.match(/^(-?\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)$/); if(f) return +f[1]/+f[2];
  return v===''?NaN:Number(v);
}
const numOk=inp=>Math.abs(num(inp.value)-Number(inp.dataset.v))<0.005+1e-9;
function setOpen(card,open){
  if(card.classList.contains('calc')){ card.classList.toggle('show-ans',open); paint(card); return; }
  if(card.classList.contains('mc')){ card.classList.toggle('show-ans',open); paint(card); return; }
  card.querySelector('.qa-ans').hidden=!open;
  const b=card.querySelector('.show');
  b.setAttribute('aria-expanded',open); b.textContent=open?'정답 숨기기':'정답 보기';
}
function tally(){
  const marks=Object.values(saved.marks);
  const ok=marks.filter(m=>m==='ok').length, done=marks.length;
  scoreEl.innerHTML=done?`<b>${ok}</b> / ${total} 맞음 · ${done}개 확인`:`문제 <b>${total}</b>개`;
  document.getElementById('prog').style.width=(done/total*100)+'%';
}

cards.forEach(card=>{
  const n=card.dataset.n;
  paint(card);
  if(card.classList.contains('calc')){
    const ins=[...card.querySelectorAll('.calc-fields input')];
    const check=()=>{
      saved.calc[n]=ins.map(i=>i.value);
      saved.marks[n]=ins.every(numOk)?'ok':'bad';
      save(); paint(card); tally();
    };
    ins.forEach((inp,i)=>{
      inp.addEventListener('input',()=>{saved.calc[n]=ins.map(x=>x.value); save(); inp.parentElement.classList.remove('ok','bad');});
      inp.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault(); if(ins[i+1]) ins[i+1].focus(); else check();}});
    });
    card.querySelector('.check').onclick=check;
    return;
  }
  if(card.classList.contains('mc')){
    card.querySelectorAll('.mc-opts button').forEach(b=>b.onclick=()=>{
      const i=+b.dataset.i;
      saved.picks[n]=i; saved.marks[n]=i===+card.dataset.answer?'ok':'bad';
      save(); paint(card); tally();
    });
    return;
  }
  card.querySelector('textarea').addEventListener('input',e=>{saved.notes[n]=e.target.value; save();});
  card.querySelector('.show').onclick=()=>setOpen(card,card.querySelector('.qa-ans').hidden);
  card.querySelectorAll('.mark').forEach(b=>b.onclick=()=>{
    const v=b.classList.contains('ok')?'ok':'bad';
    if(saved.marks[n]===v) delete saved.marks[n]; else saved.marks[n]=v;
    save(); paint(card); setOpen(card,true); tally();
  });
});
tally();
document.getElementById('quiz').addEventListener('click',e=>{
  const b=e.target.closest('.steps-btn'); if(!b) return;
  const card=b.closest('.q'); card.classList.toggle('steps-open'); paint(card);
});

const wrongBtn=document.getElementById('wrong');
wrongBtn.onclick=()=>{
  const on=document.body.classList.toggle('only-wrong');
  wrongBtn.setAttribute('aria-pressed',on);
};
const revBtn=document.getElementById('reveal');
revBtn.onclick=()=>{
  const on=revBtn.getAttribute('aria-pressed')!=='true';
  revBtn.setAttribute('aria-pressed',on);
  cards.forEach(c=>setOpen(c,on));
};
document.getElementById('reset').onclick=()=>{
  if(!confirm('고른 보기·적은 답과 맞음/틀림 표시를 모두 지울까요?')) return;
  saved={notes:{},marks:{},picks:{},calc:{}}; save();
  cards.forEach(c=>{const t=c.querySelector('textarea'); if(t) t.value=''; c.querySelectorAll('.calc-fields input').forEach(i=>i.value=''); c.classList.remove('steps-open'); setOpen(c,false); paint(c);});
  document.body.classList.remove('only-wrong');
  wrongBtn.setAttribute('aria-pressed','false'); revBtn.setAttribute('aria-pressed','false');
  tally(); window.scrollTo(0,0);
};
})();
