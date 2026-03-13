
(function(){
const SITE = 'https://www.aitool.icu';
const tools = (window.AI_TOOLS || []).map(t => ({...t, categoryName: CATEGORY_MAP[t.category]?.name || t.category}));
const $ = (s, r=document)=>r.querySelector(s);
const $$ = (s, r=document)=>Array.from(r.querySelectorAll(s));
const CATEGORY_MAP = {
  'ai-chat': {name:'AI Chat', color:'brand'},
  'ai-search': {name:'AI Search', color:'brand'},
  'ai-writing': {name:'AI Writing', color:'brand'},
  'ai-image': {name:'AI Image', color:'brand'},
  'ai-video': {name:'AI Video', color:'brand'},
  'ai-audio': {name:'AI Audio', color:'brand'},
  'ai-coding': {name:'AI Coding', color:'brand'},
  'ai-productivity': {name:'AI Productivity', color:'brand'},
  'ai-design': {name:'AI Design', color:'brand'},
  'ai-marketing': {name:'AI Marketing', color:'brand'}
};

function save(key, value){ localStorage.setItem(key, JSON.stringify(value)); }
function load(key, fallback){ try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch(e){ return fallback; } }

function slugLink(slug){ return `/tools/${slug}.html`; }

function formatPricing(t){
  const extras = [];
  if(t.freePlan) extras.push('Free plan');
  if(t.freeTrial) extras.push('Trial');
  return `${t.pricing}${extras.length ? ' · ' + extras.join(' · ') : ''}`;
}
function card(t){
  const favoriteIds = load('favorites', []);
  const compareIds = load('compare', []);
  const stackIds = load('stack-default', []);
  return `
  <article class="tool-card">
    <div class="tool-top">
      <div style="display:flex;gap:12px;align-items:flex-start">
        <div class="logo">${(t.logoLetter||t.name[0]).slice(0,1)}</div>
        <div>
          <h3><a href="${slugLink(t.slug)}">${t.name}</a></h3>
          <div class="badges">
            <span class="badge brand">${t.categoryName}</span>
            ${t.featured ? '<span class="badge ok">Featured</span>' : ''}
            ${t.deals ? '<span class="badge warn">Deal</span>' : ''}
            ${t.trending ? '<span class="badge ok">Trending</span>' : ''}
          </div>
        </div>
      </div>
      <div class="small muted">#${t.rank}</div>
    </div>
    <p>${t.description}</p>
    <div class="tool-meta">
      <div>Pricing<br><strong>${formatPricing(t)}</strong></div>
      <div>Rating<br><strong>${t.rating} / 5</strong></div>
      <div>API<br><strong>${t.api ? 'Yes' : 'No'}</strong></div>
      <div>Team<br><strong>${t.team ? 'Yes' : 'No'}</strong></div>
    </div>
    <div class="badges">
      ${t.useCases.slice(0,3).map(x=>`<span class="badge">${x}</span>`).join('')}
    </div>
    <div class="tool-actions">
      <a class="btn-soft" href="${slugLink(t.slug)}">View details</a>
      <button class="icon-btn favorite-btn ${favoriteIds.includes(t.slug)?'active':''}" data-fav="${t.slug}">❤ Save</button>
      <button class="icon-btn compare-btn ${compareIds.includes(t.slug)?'active':''}" data-compare="${t.slug}">⇄ Compare</button>
      <button class="icon-btn stack-btn ${stackIds.includes(t.slug)?'active':''}" data-stack="${t.slug}">＋ Stack</button>
    </div>
  </article>`;
}
function bindActions(scope=document){
  $$('[data-fav]', scope).forEach(btn => btn.onclick = () => {
    const slug = btn.dataset.fav;
    let fav = load('favorites', []);
    fav = fav.includes(slug) ? fav.filter(x=>x!==slug) : [...fav, slug];
    save('favorites', fav); btn.classList.toggle('active');
    updateCounters();
  });
  $$('[data-compare]', scope).forEach(btn => btn.onclick = () => {
    const slug = btn.dataset.compare;
    let c = load('compare', []);
    if(c.includes(slug)){ c = c.filter(x=>x!==slug); btn.classList.remove('active'); }
    else {
      if(c.length >= 3){ alert('You can compare up to 3 tools.'); return; }
      c.push(slug); btn.classList.add('active');
    }
    save('compare', c); updateCounters();
  });
  $$('[data-stack]', scope).forEach(btn => btn.onclick = () => {
    const slug = btn.dataset.stack;
    let s = load('stack-default', []);
    s = s.includes(slug) ? s.filter(x=>x!==slug) : [...s, slug];
    save('stack-default', s); btn.classList.toggle('active');
    updateCounters();
  });
}
function updateCounters(){
  const fav = load('favorites', []).length;
  const cmp = load('compare', []).length;
  const stk = load('stack-default', []).length;
  $$('[data-counter="favorites"]').forEach(el => el.textContent = fav);
  $$('[data-counter="compare"]').forEach(el => el.textContent = cmp);
  $$('[data-counter="stack"]').forEach(el => el.textContent = stk);
}
function newsletterInit(){
  $$('.newsletter-form').forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = $('input[type=email]', form)?.value.trim();
      const note = $('.newsletter-note', form.parentElement) || form.nextElementSibling;
      if(!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){ note.textContent = 'Enter a valid email address.'; return; }
      const list = load('newsletter-subscribers', []);
      if(!list.includes(email)) list.push(email);
      save('newsletter-subscribers', list);
      note.innerHTML = `Saved locally. Connect a real provider later, or <a href="mailto:hello@aitool.icu?subject=Newsletter%20Subscription&body=Please%20subscribe%20${encodeURIComponent(email)}">email us to subscribe now</a>.`;
      form.reset();
    });
  });
}
function filterTools(){
  const q = ($('#searchInput')?.value || $('#directorySearch')?.value || '').toLowerCase().trim();
  const cat = ($('#categoryFilter')?.value || '').trim();
  const pricing = ($('#pricingFilter')?.value || '').trim();
  const featuredOnly = $('#featuredOnly')?.checked || false;
  const sort = ($('#sortFilter')?.value || 'featured');
  let out = tools.filter(t => {
    const hit = !q || [t.name, t.description, t.categoryName, ...(t.useCases||[]), ...(t.tags||[])].join(' ').toLowerCase().includes(q);
    const catHit = !cat || t.category === cat;
    const priceHit = !pricing || t.pricing === pricing;
    const featHit = !featuredOnly || t.featured;
    return hit && catHit && priceHit && featHit;
  });
  const sorts = {
    featured:(a,b)=>(Number(b.featured)-Number(a.featured)) || (b.popularity-a.popularity),
    popularity:(a,b)=>b.popularity-a.popularity,
    rating:(a,b)=>b.rating-a.rating,
    newest:(a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt)),
    name:(a,b)=>a.name.localeCompare(b.name)
  };
  out.sort(sorts[sort] || sorts.featured);
  return out;
}
function renderCollection(targetId, arr, count){
  const root = document.getElementById(targetId);
  if(!root) return;
  root.innerHTML = arr.slice(0, count).map(card).join('') || '<div class="empty">No tools found.</div>';
  bindActions(root);
}
function renderHome(){
  renderCollection('featuredGrid', tools.filter(t=>t.featured), 8);
  renderCollection('trendingGrid', tools.filter(t=>t.trending).sort((a,b)=>b.popularity-a.popularity), 8);
  renderCollection('dealsGrid', tools.filter(t=>t.deals), 6);
  const stackRoot = document.getElementById('stackPreview');
  if(stackRoot){
    const stackIds = load('stack-default', []);
    const stackTools = tools.filter(t => stackIds.includes(t.slug));
    stackRoot.innerHTML = stackTools.length ? stackTools.slice(0,5).map(t => `<li><a href="${slugLink(t.slug)}">${t.name}</a><span>${t.pricing}</span></li>`).join('') : '<li><span class="muted">Your stack is empty.</span><a href="/directory.html">Browse tools</a></li>';
  }
}
function renderDirectory(){
  const root = document.getElementById('directoryGrid');
  if(!root) return;
  const result = filterTools();
  const count = $('#resultsCount');
  if(count) count.textContent = `${result.length} tools`;
  root.innerHTML = result.map(card).join('') || '<div class="empty">No matching tools. Try clearing some filters.</div>';
  bindActions(root);
}
function bindDirectoryEvents(){
  ['searchInput','directorySearch','categoryFilter','pricingFilter','sortFilter','featuredOnly'].forEach(id=>{
    const el = document.getElementById(id);
    if(!el) return;
    el.addEventListener(el.type === 'checkbox' ? 'change' : 'input', renderDirectory);
    if(el.tagName === 'SELECT') el.addEventListener('change', renderDirectory);
  });
}
function renderTop100(){
  const root = document.getElementById('top100List');
  if(!root) return;
  root.innerHTML = tools.slice(0,100).map(t => `
    <div class="top100-row">
      <div class="rank">#${t.rank}</div>
      <div><strong><a href="${slugLink(t.slug)}">${t.name}</a></strong><div class="small muted">${t.description}</div></div>
      <div><span class="badge brand">${t.categoryName}</span></div>
      <div>${formatPricing(t)}</div>
      <div>★ ${t.rating} · ${t.popularity}</div>
    </div>
  `).join('');
}
function renderCompare(){
  const root = document.getElementById('compareTableWrap');
  if(!root) return;
  const ids = load('compare', []);
  const selected = tools.filter(t=>ids.includes(t.slug));
  if(!selected.length){
    root.innerHTML = '<div class="empty">No tools selected. Use “Compare” buttons on the directory or tool cards first.</div>';
    return;
  }
  const fields = [
    ['Category', t=>t.categoryName],
    ['Pricing', t=>formatPricing(t)],
    ['Free plan', t=>t.freePlan ? 'Yes' : 'No'],
    ['Free trial', t=>t.freeTrial ? 'Yes' : 'No'],
    ['API', t=>t.api ? 'Yes' : 'No'],
    ['Team features', t=>t.team ? 'Yes' : 'No'],
    ['Mobile app', t=>t.mobile ? 'Yes' : 'No'],
    ['Platforms', t=>t.platforms],
    ['Languages', t=>(t.languages||[]).join(', ')],
    ['Outputs', t=>(t.outputs||[]).join(', ')],
    ['Best for', t=>t.bestFor],
    ['Use cases', t=>(t.useCases||[]).join(', ')],
    ['Privacy posture', t=>t.privacy],
    ['Export options', t=>t.exportOptions],
    ['Rating', t=>`${t.rating} / 5`],
    ['Popularity', t=>String(t.popularity)],
    ['Last updated', t=>t.updatedAt]
  ];
  root.innerHTML = `<div class="table-wrap"><table class="compare-table"><thead><tr><th>Field</th>${selected.map(t=>`<th><a href="${slugLink(t.slug)}">${t.name}</a></th>`).join('')}</tr></thead><tbody>
    ${fields.map(([label, fn])=>`<tr><td><strong>${label}</strong></td>${selected.map(t=>`<td>${fn(t)}</td>`).join('')}</tr>`).join('')}
  </tbody></table></div>`;
}
function fillCounts(){
  const total = tools.length;
  $$('[data-stat="tool-count"]').forEach(el => el.textContent = String(total));
  Object.entries(CATEGORY_MAP).forEach(([slug, meta]) => {
    const n = tools.filter(t=>t.category===slug).length;
    $$(`[data-catcount="${slug}"]`).forEach(el => el.textContent = String(n));
  });
}
document.addEventListener('DOMContentLoaded', () => {
  fillCounts();
  updateCounters();
  bindDirectoryEvents();
  newsletterInit();
  renderHome();
  renderDirectory();
  renderTop100();
  renderCompare();
});
})();
