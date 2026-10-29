// 문제 엔진. 페이지에 window.QUIZ = {key, sections:[{id,title,items:[{q,a,choices?,answer?}]}]} 가 있어야 합니다.
// choices가 있으면 객관식: 보기를 누르면 바로 채점하고 해설(a)을 보여 줍니다.
// 없으면 주관식: 답을 적고(선택) 정답을 확인한 뒤 스스로 맞음/틀림을 표시합니다.
(function(){
const Q=window.QUIZ; if(!Q) return;
const KEY=Q.key;

let saved={notes:{},marks:{},picks:{}};
try{const s=JSON.parse(localStorage.getItem(KEY)||'null'); if(s&&s.notes&&s.marks) saved=Object.assign(saved,s)}catch(e){}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(saved))}catch(e){}};

const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

const quiz=document.getElementById('quiz');
let qn=0;
Q.sections.forEach(sec=>{
  const s=document.createElement('section'); s.id=sec.id;
  s.innerHTML=`<h2>${esc(sec.title)}</h2>`;
  sec.items.forEach(({q,a,choices,answer})=>{
    const n=++qn;
    const d=document.createElement('div'); d.className='q qa'; d.dataset.n=n;
    if(choices){
      d.classList.add('mc'); d.dataset.answer=answer;
      d.innerHTML=`<p><span>${n}</span>${esc(q)}</p>
<div class="qa-body">
  <ol class="mc-opts">${choices.map((c,i)=>`<li><button type="button" data-i="${i}"><b>${'①②③④⑤'[i]}</b>${esc(c)}</button></li>`).join('')}</ol>
  <div class="qa-ans" hidden><b>해설</b> ${esc(a)}</div>
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

function paint(card){
  const n=card.dataset.n, m=saved.marks[n];
  card.classList.toggle('marked-ok',m==='ok');
  card.classList.toggle('marked-bad',m==='bad');
  card.classList.toggle('allok',m==='ok');
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
    return;
  }
  card.querySelector('.mark.ok').setAttribute('aria-pressed',m==='ok');
  card.querySelector('.mark.bad').setAttribute('aria-pressed',m==='bad');
}
function setOpen(card,open){
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
  saved={notes:{},marks:{},picks:{}}; save();
  cards.forEach(c=>{const t=c.querySelector('textarea'); if(t) t.value=''; setOpen(c,false); paint(c);});
  document.body.classList.remove('only-wrong');
  wrongBtn.setAttribute('aria-pressed','false'); revBtn.setAttribute('aria-pressed','false');
  tally(); window.scrollTo(0,0);
};
})();
