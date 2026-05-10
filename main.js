// ─── FALAAH PORTAL — main.js ─────────────────────────────────────────────────
const SUPABASE_URL      = 'https://hqhwphrckizfnkthdzfx.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_A_uHsj9_CSvnNbMzaA74vA_qey-gTRu';

let supabaseClient;
let NGO_DATA = [];

let currentPage    = 'home';
let activeCategory = 'all';
let searchQuery    = '';
let activeProvince = 'All Provinces';

const CATEGORIES = [
  { name: 'All Categories',                        id: 'all' },
  { name: 'Healthcare and Medical Services',       id: 'healthcare' },
  { name: 'Education and Literacy',                id: 'education' },
  { name: 'Poverty Alleviation and Microfinance',  id: 'poverty' },
  { name: 'Women Empowerment and Gender Equality', id: 'women' },
  { name: 'Human Rights and Legal Aid',            id: 'rights' },
  { name: 'Disaster Relief and Humanitarian Aid',  id: 'disaster' },
  { name: 'Environment and Climate Action',        id: 'environment' },
  { name: 'Child Welfare and Protection',          id: 'children' },
  { name: 'Rural Development and Community Uplift',id: 'rural' },
  { name: 'Disability and Special Needs',          id: 'disability' },
];

const PROVINCES = [
  'All Provinces','Sindh','Punjab','KPK',
  'Balochistan','Islamabad (Federal)','Gilgit-Baltistan','AJK',
];

const CAT_ID_TO_NAME = {
  1:'Healthcare and Medical Services',
  2:'Education and Literacy',
  3:'Poverty Alleviation and Microfinance',
  4:'Women Empowerment and Gender Equality',
  5:'Human Rights and Legal Aid',
  6:'Disaster Relief and Humanitarian Aid',
  7:'Environment and Climate Action',
  8:'Child Welfare and Protection',
  9:'Rural Development and Community Uplift',
  10:'Disability and Special Needs',
};

function initSupabase() {
  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  console.log('Supabase initialised');
  loadNGOs();
}

async function loadNGOs() {
  const list = document.getElementById('ngoList');
  if (list) list.innerHTML = `<div style="text-align:center;padding:80px 20px;color:var(--text-muted)"><div style="font-size:2rem;margin-bottom:12px"></div><p>Loading organisations…</p></div>`;

  const { data, error } = await supabaseClient
    .from('ngos')
    .select('*, categories(name)')
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) {
    console.error('Supabase error:', error);
    showToast('Could not reach the database.');
    NGO_DATA = [];
  } else {
    NGO_DATA = (data || []).map(ngo => ({
      ...ngo,
      category: ngo.categories?.name || CAT_ID_TO_NAME[ngo.category_id] || 'Uncategorised',
    }));
    console.log('Loaded ' + NGO_DATA.length + ' NGOs');
  }

  renderCategoryCards();
  renderSidebarCats();
  renderNGOList();
}

function showPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
  const target = document.getElementById('page-' + pageId);
  if (target) target.classList.add('active');
  const navLink = document.querySelector('.nav-links a[data-page="' + pageId + '"]');
  if (navLink) navLink.classList.add('active');
  currentPage = pageId;
  window.scrollTo({ top: 0, behavior: 'smooth' });
  closeMobileMenu();
  if (pageId === 'directory') { renderCategoryCards(); renderSidebarCats(); renderNGOList(); }
}

function toggleMobileMenu() {
  const menu = document.getElementById('mobileMenu');
  menu.classList.toggle('open');
  document.body.style.overflow = menu.classList.contains('open') ? 'hidden' : '';
}
function closeMobileMenu() {
  document.getElementById('mobileMenu').classList.remove('open');
  document.body.style.overflow = '';
}

function getInitials(name) {
  return name.split(' ').filter(w => w.length > 2).slice(0, 2).map(w => w[0]).join('').toUpperCase() || name.slice(0, 2).toUpperCase();
}
function catById(id) { return CATEGORIES.find(c => c.id === id); }
function ngoCountForCat(catId) {
  if (catId === 'all') return NGO_DATA.length;
  const cat = catById(catId);
  return cat ? NGO_DATA.filter(n => n.category === cat.name).length : 0;
}

function renderSidebarCats() {
  const el = document.getElementById('sidebarCats');
  if (!el) return;
  el.innerHTML = CATEGORIES.map(cat =>
    '<button class="sidebar-cat-btn ' + (activeCategory === cat.id ? 'active' : '') + '" onclick="selectCategory(\'' + cat.id + '\',\'' + cat.name + '\')">' +
    '<span style="display:flex;align-items:center;gap:7px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"><span>' + cat.icon + '</span><span>' + cat.name + '</span></span>' +
    '<span class="badge">' + ngoCountForCat(cat.id) + '</span></button>'
  ).join('');
}

function renderCategoryCards() {
  const el = document.getElementById('categoriesGrid');
  if (!el) return;
  el.innerHTML = CATEGORIES.filter(c => c.id !== 'all').map(cat => {
    const count = ngoCountForCat(cat.id);
    return '<div class="cat-card ' + (activeCategory === cat.id ? 'active' : '') + '" onclick="selectCategory(\'' + cat.id + '\',\'' + cat.name + '\')">' +
      '<div class="cat-icon">' + cat.icon + '</div>' +
      '<div><div class="cat-name">' + cat.name + '</div><div class="cat-count">' + count + ' NGO' + (count !== 1 ? 's' : '') + '</div></div></div>';
  }).join('');
}

function selectCategory(catId, catName) {
  activeCategory = catId;
  renderSidebarCats(); renderCategoryCards(); renderNGOList();
  const h = document.getElementById('ngoSectionTitle');
  if (h) h.textContent = catId === 'all' ? 'All NGOs' : catName;
  showPage('directory');
}

function toggleNGO(id) {
  const card = document.getElementById('ngo-' + id);
  const isOpen = card.classList.contains('open');
  document.querySelectorAll('.ngo-card.open').forEach(c => c.classList.remove('open'));
  if (!isOpen) card.classList.add('open');
}

function renderNGOCard(ngo) {
  const id       = ngo.id;
  const name     = ngo.name          || '';
  const category = ngo.category      || '';
  const location = ngo.location_hq   || '—';
  const focal    = ngo.focal_person   || 'To be updated';
  const contact  = ngo.contact_info   || 'To be updated';
  const founded  = ngo.founded        || '—';
  const desc     = ngo.description    || '';
  const website  = ngo.website        || '';
  const logo     = ngo.logo_url       || null;

  const websiteLink = website
    ? '<a href="' + website + '" target="_blank" rel="noopener">' + website.replace(/https?:\/\//, '') + '</a>'
    : '<span style="color:var(--text-light);font-style:italic">Not available yet</span>';

  const logoHtml = logo
    ? '<img src="' + logo + '" alt="' + name + ' logo">'
    : '<span class="ngo-logo-placeholder">' + getInitials(name) + '</span>';

  return '<div class="ngo-card" id="ngo-' + id + '">' +
    '<div class="ngo-card-header" onclick="toggleNGO(\'' + id + '\')" role="button" tabindex="0" onkeydown="if(event.key===\'Enter\')toggleNGO(\'' + id + '\')">' +
    '<div class="ngo-logo">' + logoHtml + '</div>' +
    '<div class="ngo-card-meta"><div class="ngo-name">' + name + '</div>' +
    '<div class="ngo-tags"><span class="ngo-tag">' + category + '</span><span class="ngo-loc-tag">📍 ' + location + '</span></div></div>' +
    '<div class="ngo-chevron"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg></div></div>' +
    '<div class="ngo-card-body">' +
    '<p class="ngo-desc">' + desc + '</p>' +
    '<div class="ngo-info-grid">' +
    '<div><div class="info-label">Focal Person</div><div class="info-value">' + focal + '</div></div>' +
    '<div><div class="info-label">Contact</div><div class="info-value">' + contact + '</div></div>' +
    '<div><div class="info-label">Founded</div><div class="info-value">' + founded + '</div></div>' +
    '<div><div class="info-label">Website</div><div class="info-value">' + websiteLink + '</div></div>' +
    '</div>' +
    '<div class="ngo-card-footer">' +
    (website ? '<a href="' + website + '" target="_blank" rel="noopener" class="btn btn-primary" style="font-size:0.82rem;padding:9px 18px">Visit Website ↗</a>' : '') +
    '<button class="btn btn-ghost" style="font-size:0.82rem;padding:9px 18px" onclick="toggleNGO(\'' + id + '\')">Close ↑</button>' +
    '</div></div></div>';
}

function renderNGOList() {
  const container = document.getElementById('ngoList');
  const countEl   = document.getElementById('ngoCount');
  if (!container) return;

  let filtered = [...NGO_DATA];

  if (activeCategory !== 'all') {
    const cat = catById(activeCategory);
    if (cat) filtered = filtered.filter(n => n.category === cat.name);
  }
  if (activeProvince !== 'All Provinces') {
    filtered = filtered.filter(n => (n.location_hq || '').toLowerCase().includes(activeProvince.toLowerCase()));
  }
  if (searchQuery.trim()) {
    const q = searchQuery.trim().toLowerCase();
    filtered = filtered.filter(n =>
      (n.name || '').toLowerCase().includes(q) ||
      (n.description || '').toLowerCase().includes(q) ||
      (n.category || '').toLowerCase().includes(q) ||
      (n.location_hq || '').toLowerCase().includes(q) ||
      (n.focal_person || '').toLowerCase().includes(q)
    );
  }

  if (countEl) countEl.textContent = filtered.length + ' result' + (filtered.length !== 1 ? 's' : '');

  container.innerHTML = filtered.length === 0
    ? '<div class="no-results"><div class="icon"></div><p>No NGOs match your search.<br>Try different keywords or clear the filters.</p><button class="btn btn-outline" style="margin-top:18px" onclick="clearFilters()">Clear all filters</button></div>'
    : filtered.map(renderNGOCard).join('');
}

function clearFilters() {
  searchQuery = ''; activeCategory = 'all'; activeProvince = 'All Provinces';
  const s = document.getElementById('mainSearch');
  const p = document.getElementById('provinceFilter');
  if (s) s.value = ''; if (p) p.value = 'All Provinces';
  renderSidebarCats(); renderCategoryCards(); renderNGOList();
  const h = document.getElementById('ngoSectionTitle');
  if (h) h.textContent = 'All NGOs';
}

function initSearchBar() {
  const si = document.getElementById('mainSearch');
  const pf = document.getElementById('provinceFilter');
  if (si) { let t; si.addEventListener('input', e => { clearTimeout(t); t = setTimeout(() => { searchQuery = e.target.value; renderNGOList(); }, 260); }); }
  if (pf) pf.addEventListener('change', e => { activeProvince = e.target.value; renderNGOList(); });
}

function populateFilters() {
  const pf = document.getElementById('provinceFilter');
  if (pf) pf.innerHTML = PROVINCES.map(p => '<option value="' + p + '">' + p + '</option>').join('');
  const sc = document.getElementById('submitCategory');
  if (sc) sc.innerHTML = '<option value="">— Select a Category —</option>' +
    CATEGORIES.filter(c => c.id !== 'all').map(c => '<option value="' + c.name + '">' + c.name + '</option>').join('');
}

async function handleSubmitForm(e) {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  btn.textContent = 'Submitting…'; btn.disabled = true;
  const catName = document.getElementById('submitCategory')?.value;
  const catEntry = Object.entries(CAT_ID_TO_NAME).find(([, v]) => v === catName);
  const payload = {
    name:               document.getElementById('ngoName')?.value.trim(),
    category_id:        catEntry ? parseInt(catEntry[0]) : null,
    description:        document.getElementById('ngoDesc')?.value.trim(),
    focal_person:       document.getElementById('focalPerson')?.value.trim()   || null,
    contact_info:       document.getElementById('contactNumber')?.value.trim() || null,
    website:            document.getElementById('ngoWebsite')?.value.trim()    || null,
    location_hq:        document.getElementById('ngoLocation')?.value.trim()   || null,
    submitted_by_email: document.getElementById('submitterEmail')?.value.trim(),
    is_active:          false,
    verified:           false,
  };
  const { error } = await supabaseClient.from('ngos').insert([payload]);
  if (error) { console.error(error); showToast('Submission failed. Please try again.'); }
  else { showToast('Submitted. Our team will review it shortly.'); e.target.reset(); }
  btn.textContent = 'Submit for Review →'; btn.disabled = false;
}

function handleContactForm(e) {
  e.preventDefault();
  showToast("Message sent. We'll get back to you soon.");
  e.target.reset();
}

function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg; t.style.display = 'block';
  clearTimeout(t._timer);
  t._timer = setTimeout(() => { t.style.display = 'none'; }, 4500);
}

let isUrdu = false;
function toggleLang() {
  isUrdu = !isUrdu;
  const btn = document.getElementById('langBtn');
  if (btn) btn.textContent = isUrdu ? 'English' : 'اردو';
  showToast(isUrdu ? 'اردو موڈ جلد آ رہا ہے' : 'Urdu mode coming soon');
  if (isUrdu) setTimeout(() => { isUrdu = false; if (btn) btn.textContent = 'اردو'; }, 150);
}

function initLogoUpload() {
  const area = document.querySelector('.upload-area');
  const input = document.getElementById('logoUpload');
  if (!area || !input) return;
  area.addEventListener('click', () => input.click());
  area.addEventListener('dragover', e => { e.preventDefault(); area.style.borderColor = 'var(--navy)'; });
  area.addEventListener('dragleave', () => { area.style.borderColor = ''; });
  area.addEventListener('drop', e => {
    e.preventDefault(); area.style.borderColor = '';
    const f = e.dataTransfer.files[0];
    if (f) area.querySelector('p').textContent = '✓ ' + f.name + ' ready to upload';
  });
  input.addEventListener('change', e => {
    if (e.target.files[0]) area.querySelector('p').textContent = '✓ ' + e.target.files[0].name + ' ready to upload';
  });
}

document.addEventListener('DOMContentLoaded', () => {
  populateFilters();
  initSearchBar();
  initLogoUpload();
  document.getElementById('submitNGOForm')?.addEventListener('submit', handleSubmitForm);
  document.getElementById('contactForm')?.addEventListener('submit', handleContactForm);
  showPage('home');

  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
  script.onload = initSupabase;
  script.onerror = () => showToast('Failed to load database library. Check your internet.');
  document.head.appendChild(script);
});
