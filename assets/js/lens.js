// 이론 페이지 보기 필터와 용어 사전.
// 본문 항목의 data-k: m = ★ 출제, e = 출제 예상, x = 참고. data-term = 용어 이해(함께 붙음). <dfn>은 용어 사전에 모읍니다.
(function(){
const main=document.getElementById('main'); if(!main) return;
const KEY='lens-'+location.pathname;
const MODES={all:null,m:e=>e.dataset.k==='m',me:e=>e.dataset.k==='m'||e.dataset.k==='e',t:e=>e.hasAttribute('data-term')};
const items=[...main.querySelectorAll('[data-k]')].filter(e=>!e.closest('.keep'));

// 용어 사전: 각 <dfn>이 들어 있는 문장(" / "로 나뉜 조각)을 정의로 씀
const gloss=document.getElementById('gloss');
if(gloss){
  const seen=new Set(); let n=0;
  main.querySelectorAll('dfn').forEach(d=>{
    if(d.closest('.keep')) return;
    const term=d.textContent.trim(); if(seen.has(term)) return; seen.add(term);
    const host=d.closest('li,td'); const sec=d.closest('section'); if(!host||!sec) return;
    if(!host.id) host.id='g'+(++n);
    let html;
    if(host.tagName==='TD'){
      html=[...host.parentElement.cells].map(c=>c.innerHTML).filter(s=>s&&s!=='-').join(' · ');
    }else{
      // " / "는 용어와 용어 사이에서만 나눔 (식 안의 1 / (1 + e⁻ˣ) 같은 것은 그대로)
      const groups=[];
      host.innerHTML.split(' / ').forEach(p=>{
        const last=groups[groups.length-1];
        if(last&&!(p.includes('<dfn')&&last.includes('<dfn'))) groups[groups.length-1]=last+' / '+p; else groups.push(p);
      });
      html=groups.find(p=>p.includes('>'+d.innerHTML+'</dfn>'))||host.innerHTML;
    }
    const ch=sec.querySelector('h2').textContent.split('.')[0];
    const dt=document.createElement('dt'); dt.textContent=term;
    const a=document.createElement('a'); a.href='#'+host.id; a.textContent=ch; dt.appendChild(a);
    const dd=document.createElement('dd'); dd.innerHTML=html;
    dd.querySelectorAll('a').forEach(x=>x.replaceWith(...x.childNodes));
    gloss.append(dt,dd);
  });
}

// 보기 필터
const bar=document.querySelector('.lens');
if(!bar) return;
const btns=[...bar.querySelectorAll('[data-lens]')];
btns.forEach(b=>{
  const allow=MODES[b.dataset.lens];
  const c=allow?items.filter(allow).length:items.length;
  const s=document.createElement('span'); s.className='n'; s.textContent=c; b.appendChild(s);
});

function syncToc(){
  document.querySelectorAll('#toc a').forEach(a=>{
    const t=document.getElementById(decodeURIComponent(a.hash.slice(1)));
    a.parentElement.hidden=!!(t&&t.closest('[hidden]'));
    if(t&&t.tagName==='H3'&&t.parentElement.querySelector('[data-k="m"]')) a.classList.add('has-m');
  });
}
function apply(mode){
  if(!(mode in MODES)) mode='all';
  const allow=MODES[mode];
  document.body.dataset.lens=mode;
  btns.forEach(b=>b.setAttribute('aria-pressed',b.dataset.lens===mode));
  items.forEach(e=>e.hidden=allow?!allow(e):false);
  main.querySelectorAll('.card ul,.card ol').forEach(l=>{
    if(!l.querySelector(':scope>li[data-k]')) return;
    l.hidden=allow?![...l.children].some(li=>!li.hidden):false;
  });
  main.querySelectorAll('section .card').forEach(c=>{
    if(c.closest('.keep')) return;
    c.hidden=allow?![...c.querySelectorAll('[data-k]')].some(e=>!e.hidden):false;
  });
  main.querySelectorAll('section[id]').forEach(s=>{
    if(s.classList.contains('keep')) return;
    s.hidden=allow?!s.querySelector('.card:not([hidden])'):false;
  });
  syncToc();
  try{localStorage.setItem(KEY,mode)}catch(e){}
}
btns.forEach(b=>b.onclick=()=>{
  apply(b.dataset.lens);
  const top=bar.getBoundingClientRect().top;
  if(top<0||top>innerHeight) bar.scrollIntoView();
});
let saved='all'; try{saved=localStorage.getItem(KEY)||'all'}catch(e){}
apply(saved);
// 목차는 레이아웃 스크립트가 이 파일 다음에 만들므로 끝난 뒤 한 번 더 맞춤
addEventListener('DOMContentLoaded',syncToc);
})();
