
const COLORS=['#60a5fa','#f59e0b','#34d399','#c084fc','#f87171','#22d3ee','#a3e635','#fb7185','#facc15','#818cf8'];
const tooltip=document.getElementById('tooltip');
const fmt=v=>(v>=0?'+':'')+v.toFixed(1).replace('.',',')+' %';

let DB=null, DATA=null, NAMES=null;

async function loadData(){
  const res=await fetch('data/housing.json');
  DB=await res.json();
  DATA=DB.series; NAMES=DB.countries;
  init();
}

function init(){
  ['countrySel','simCountry'].forEach(id=>fillCountrySelect(document.getElementById(id)));
  fillYears(document.getElementById('startSel'),1975,2025,1975);
  fillYears(document.getElementById('compareStart'),1975,2025,1975);
  fillYears(document.getElementById('simStart'),1975,2025,1975);

  document.querySelectorAll('.tab').forEach(b=>b.addEventListener('click',()=>{
    document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));
    document.querySelectorAll('.view').forEach(x=>x.classList.remove('active'));
    b.classList.add('active'); document.getElementById(b.dataset.view).classList.add('active');
    if(b.dataset.view==='countryView') renderCountry();
    if(b.dataset.view==='compareView') renderCompare();
    if(b.dataset.view==='simView') renderSim();
  }));

  document.getElementById('countrySel').addEventListener('change',()=>renderCountry());
  document.getElementById('startSel').addEventListener('change',()=>renderCountry());
  document.getElementById('compareStart').addEventListener('change',()=>renderCompare());
  ['simCountry','simStart','rentYield','debtYears','reinvestPct','worldReturn']
    .forEach(id=>document.getElementById(id).addEventListener('input',()=>renderSim()));

  renderCountry(); renderCompare(); renderSim();
}

function fillCountrySelect(el,selected='FR'){
  Object.entries(NAMES).forEach(([c,n])=>{const o=document.createElement('option');o.value=c;o.textContent=n;if(c===selected)o.selected=true;el.appendChild(o);});
}
function fillYears(el,min,max,selected){
  for(let y=min;y<=max;y++){const o=document.createElement('option');o.value=y;o.textContent=y;if(y===selected)o.selected=true;el.appendChild(o);}
}
function seriesFrom(code,start){
  const arr=DATA[code].filter(d=>d.year>=start); if(!arr.length)return [];
  const b=arr[0];
  return arr.map(d=>({
    year:d.year,
    nominal:(d.nominal/b.nominal-1)*100,
    real:(d.real/b.real-1)*100,
    inflation:(d.cpi/b.cpi-1)*100,
    nominalIndex:d.nominal/b.nominal*100,
    cpiIndex:d.cpi/b.cpi*100
  }));
}
function makeLegend(container,series,rerender){
  container.innerHTML='';
  series.forEach((s,i)=>{
    const b=document.createElement('button'); b.textContent=s.label; b.style.borderColor=s.color;
    if(s.hidden)b.classList.add('off');
    b.addEventListener('click',()=>{s.hidden=!s.hidden;b.classList.toggle('off');rerender();});
    container.appendChild(b);
  });
}
function drawChart(svg,xvals,series){
  const W=1100,H=540,M={l:72,r:25,t:26,b:48},iw=W-M.l-M.r,ih=H-M.t-M.b;
  svg.setAttribute('viewBox',`0 0 ${W} ${H}`);
  const visible=series.filter(s=>!s.hidden), all=visible.flatMap(s=>s.values.filter(Number.isFinite));
  if(!all.length)return;
  let ymin=Math.min(0,...all),ymax=Math.max(0,...all),pad=(ymax-ymin||1)*.08;ymin-=pad;ymax+=pad;
  const x=i=>M.l+(xvals.length===1?iw/2:i*iw/(xvals.length-1)), y=v=>M.t+(ymax-v)*ih/(ymax-ymin);
  let out='';
  for(let i=0;i<=6;i++){let val=ymin+(ymax-ymin)*i/6,yy=y(val);out+=`<line x1="${M.l}" y1="${yy}" x2="${W-M.r}" y2="${yy}" stroke="rgba(148,163,184,.15)"/><text x="${M.l-10}" y="${yy+4}" text-anchor="end" fill="#94a3b8" font-size="12">${Math.round(val)} %</text>`;}
  const tickEvery=Math.max(1,Math.ceil(xvals.length/10));xvals.forEach((v,i)=>{if(i%tickEvery===0||i===xvals.length-1)out+=`<text x="${x(i)}" y="${H-16}" text-anchor="middle" fill="#94a3b8" font-size="12">${v}</text>`;});
  out+=`<line x1="${M.l}" y1="${y(0)}" x2="${W-M.r}" y2="${y(0)}" stroke="rgba(229,231,235,.35)"/>`;
  visible.forEach(s=>{let d='';s.values.forEach((v,i)=>{if(Number.isFinite(v))d+=(d?'L':'M')+x(i).toFixed(1)+','+y(v).toFixed(1);});out+=`<path d="${d}" fill="none" stroke="${s.color}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>`;});
  out+=`<line id="hoverLine" x1="0" y1="${M.t}" x2="0" y2="${H-M.b}" stroke="rgba(229,231,235,.5)" stroke-dasharray="4 4" style="display:none"/><rect id="hit" x="${M.l}" y="${M.t}" width="${iw}" height="${ih}" fill="transparent"/>`;
  svg.innerHTML=out;
  const hit=svg.querySelector('#hit'),hover=svg.querySelector('#hoverLine');
  hit.addEventListener('mousemove',e=>{
    const rect=svg.getBoundingClientRect(),sx=W/rect.width,mx=(e.clientX-rect.left)*sx;
    let i=Math.round((mx-M.l)/iw*(xvals.length-1));i=Math.max(0,Math.min(xvals.length-1,i));
    hover.setAttribute('x1',x(i));hover.setAttribute('x2',x(i));hover.style.display='block';
    let h=`<b>${xvals[i]}</b>`;visible.forEach(s=>{const v=s.values[i];if(Number.isFinite(v))h+=`<div style="color:${s.color}">${s.label} : <b>${fmt(v)}</b></div>`;});
    tooltip.innerHTML=h;tooltip.style.display='block';tooltip.style.left=(e.clientX+14)+'px';tooltip.style.top=(e.clientY+14)+'px';
  });
  hit.addEventListener('mouseleave',()=>{hover.style.display='none';tooltip.style.display='none';});
}

let countrySeries=[
  {label:'Immobilier nominal',color:COLORS[0],hidden:false,values:[]},
  {label:'Inflation cumulée',color:COLORS[1],hidden:false,values:[]},
  {label:'Immobilier réel',color:COLORS[2],hidden:false,values:[]}
];
function renderCountry(legend=true){
  const code=countrySel.value,start=+startSel.value,d=seriesFrom(code,start);if(!d.length)return;
  countrySeries[0].values=d.map(x=>x.nominal);countrySeries[1].values=d.map(x=>x.inflation);countrySeries[2].values=d.map(x=>x.real);
  const last=d[d.length-1],years=d.length-1;
  cNom.textContent=fmt(last.nominal);cInf.textContent=fmt(last.inflation);cReal.textContent=fmt(last.real);
  cCagr.textContent=years>0?fmt((Math.pow(1+last.real/100,1/years)-1)*100):'—';
  if(legend)makeLegend(legendCountry,countrySeries,()=>renderCountry(false));
  drawChart(chartCountry,d.map(x=>x.year),countrySeries);
}

let compareSeries=[];
function renderCompare(legend=true){
  const start=+compareStart.value,years=Array.from({length:2025-start+1},(_,i)=>start+i);
  if(!compareSeries.length) compareSeries=Object.entries(NAMES).map(([c,n],i)=>({code:c,label:n,color:COLORS[i],hidden:false,values:[]}));
  compareSeries.forEach(s=>{const d=seriesFrom(s.code,start),mp=new Map(d.map(x=>[x.year,x.real]));s.values=years.map(y=>mp.has(y)?mp.get(y):NaN);});
  if(legend)makeLegend(legendCompare,compareSeries,()=>renderCompare(false));
  drawChart(chartCompare,years,compareSeries);
}

let simSeries=[
  {label:'Valeur du bien',color:COLORS[0],hidden:false,values:[]},
  {label:'Inflation',color:COLORS[1],hidden:false,values:[]},
  {label:'Immobilier + portefeuille World',color:COLORS[2],hidden:false,values:[]},
  {label:'Portefeuille World seul',color:COLORS[3],hidden:true,values:[]}
];
function renderSim(legend=true){
  const code=simCountry.value,start=+simStart.value,ry=+rentYield.value/100,debt=Math.max(1,+debtYears.value||20),rp=Math.max(0,Math.min(1,+reinvestPct.value/100)),wr=+worldReturn.value/100;
  const d=seriesFrom(code,start);if(!d.length)return;
  let portfolio=0;const total=[],port=[];
  d.forEach((row,i)=>{
    if(i>0)portfolio*=1+wr;
    const annualRent=100*ry*(row.cpiIndex/100);
    if(i>debt)portfolio+=annualRent*rp;
    port.push(portfolio);total.push(row.nominalIndex+portfolio);
  });
  simSeries[0].values=d.map(x=>x.nominal);simSeries[1].values=d.map(x=>x.inflation);simSeries[2].values=total.map(v=>v-100);simSeries[3].values=port;
  const last=d[d.length-1],nYears=d.length-1,has=nYears>debt;
  sProp.textContent=fmt(last.nominal);sWorld.textContent=fmt(portfolio);sTotal.textContent=fmt(total[total.length-1]-100);sInf.textContent=fmt(last.inflation);
  simMsg.className=has?'callout':'callout warn';
  simMsg.innerHTML=has?`Sur ${nYears} ans, les <b>${debt} premières années</b> de loyers servent au remboursement. À partir de l’année ${debt+1}, <b>${Math.round(rp*100)} %</b> des loyers sont réinvestis.`:`Horizon de ${nYears} ans : aucun loyer n’est encore réinvesti car la durée de remboursement est de ${debt} ans.`;
  if(legend)makeLegend(legendSim,simSeries,()=>renderSim(false));
  drawChart(chartSim,d.map(x=>x.year),simSeries);
}

loadData().catch(err=>{
  document.body.innerHTML='<div style="padding:30px;font-family:sans-serif">Impossible de charger les données. Vérifie que le site est servi via GitHub Pages et non ouvert directement depuis le disque.</div>';
  console.error(err);
});
