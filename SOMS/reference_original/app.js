import { api } from './api.js';
import { e, skipToMain } from './components.js';
import { dashboard, disposeDashboard } from './pages/dashboard.js';
import { management } from './pages/management.js';
import { observations } from './pages/observations.js';
import { reports, reportDetail, newReport } from './pages/reports.js';
import { renderAuth } from './pages/auth.js';

const app = document.querySelector('#app');
document.querySelector('.skip').addEventListener('click', event => skipToMain(event, document));
let session = null;
let routeVersion = 0;
const links = [
  ['dashboard', 'DASHBOARD', 'speedometer2'],
  ['reports', 'REPORT', 'file-earmark'],
  ['passes', 'PASS DETAIL', 'calendar-week'],
  ['satellite-data', 'ORBITAL ALTITUDE', 'graph-up-arrow'],
  ['/planner/', 'SAT PASS PLANNER', 'graph-up-arrow'],
  ['space-weather', 'SPACE WEATHER', 'moisture'],
  ['operations', 'OPERATOR LIST', 'person-workspace'],
];
const adminLinks = [['missions', 'MISSIONS', 'diagram-2'], ['troubles', 'SUB/TROUBLES', 'exclamation-diamond'], ['users', 'USER', 'people']];

function navigation(page) {
  const render = ([key, label, icon]) => `<a class="nav-link" href="${key.startsWith('https:') || key.startsWith('/') ? key : '#' + key}" ${key === page ? 'aria-current="page"' : ''}><i class="bi bi-${icon} me-2"></i> ${label}</a>`;
  // The original menu uses account 14; expose it for the synthetic developer too.
  const showAdmin = Number(session.user.rbac_id) === 14 || session.user.rbac_username === 'developer';
  return `<nav class="nav flex-column gap-1">${links.map(render).join('')}${showAdmin ? '<div class="fw-bold text-secondary text-uppercase small mb-3 mt-3">ADMIN</div>' + adminLinks.map(render).join('') : ''}</nav>`;
}
function setBodyTopPadding() { document.body.style.paddingTop = document.querySelector('.navbar')?.offsetHeight + 'px'; }
window.addEventListener('resize', () => { if (!document.body.classList.contains('auth-page')) setBodyTopPadding(); });
function login() {
  document.body.style.removeProperty('padding-top');
  document.title = session?.setupRequired ? 'Set Password' : 'Satellite Operations Information System';
  document.body.className = session?.setupRequired ? 'auth-page setup-page' : 'auth-page';
  renderAuth(app, session, async next => { session = next; await route(); });
}
async function route() {
  const version = ++routeVersion;
  disposeDashboard();
  if (window.jQuery?.fn.dataTable) window.jQuery.fn.dataTable.tables().forEach(table => window.jQuery(table).DataTable().destroy());
  document.querySelectorAll('.modal.show').forEach(node => window.bootstrap?.Modal.getInstance(node)?.hide());
  document.querySelectorAll('.offcanvas.show').forEach(node => window.bootstrap?.Offcanvas.getInstance(node)?.hide());
  document.querySelectorAll('.modal-backdrop,.offcanvas-backdrop').forEach(node => node.remove());
  document.body.className = '';
  document.body.style.removeProperty('overflow');
  document.body.style.removeProperty('padding-right');
  if (!session?.user || session.setupRequired) { login(); return; }
  const [path, query = ''] = (location.hash.slice(1) || 'dashboard').split('?');
  const [page, id] = path.split('/');
  const menu = navigation(page);
  app.innerHTML = `<nav class="navbar brand-top fixed-top shadow-sm"><div class="container-fluid d-flex align-items-center justify-content-between">
    <button class="btn btn-mono-danger btn-sm d-block d-lg-none" type="button" data-bs-toggle="offcanvas" data-bs-target="#offcanvasSidebar" aria-label="Open menu"><i class="bi bi-list"></i></button>
    <a class="navbar-brand mx-auto mx-lg-0 text-center" href="#dashboard"><img src="/assets/png-isr.png" alt="Satellite Icon" height="28" class="me-1"> <span class="d-none d-md-inline">Satellite Operations Information System</span><span class="d-inline d-md-none fw-semibold">SOIS</span></a>
    <div class="d-flex align-items-center gap-2"><span class="d-none d-sm-inline text-white small"><i class="bi bi-person-circle me-1"></i> ${e(session.user.rbac_username)}</span><button id="logout" class="btn btn-mono-danger btn-sm"><i class="bi bi-box-arrow-right"></i><span class="d-none d-md-inline"> Sign Out</span></button></div>
    </div></nav><div class="container-fluid"><div class="row"><div class="col-lg-3 col-xl-2 p-0 d-none d-lg-block"><aside class="sidebar p-3"><div class="fw-bold text-secondary text-uppercase small mb-3">MENU</div>${menu}</aside></div>
    <div class="offcanvas offcanvas-start" tabindex="-1" id="offcanvasSidebar" aria-labelledby="offcanvasSidebarLabel"><div class="offcanvas-header"><h5 class="offcanvas-title" id="offcanvasSidebarLabel">MENU</h5><button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button></div><div class="offcanvas-body">${menu}</div></div>
    <main id="main" class="col-12 col-lg-9 col-xl-10 p-4" tabindex="-1"><p role="status">Loading…</p></main></div></div><footer class="border-top mt-5 py-3 small"><div class="container-fluid px-4">© ${new Date().getFullYear()} SPACE INTELLIGENCE SURVEILLANCE AND RECONNAISSANCE DIVISION</div></footer>`;
  setBodyTopPadding();
  document.fonts.ready.then(() => { if (version === routeVersion && !document.body.classList.contains("auth-page")) setBodyTopPadding(); });
  app.querySelector('#logout').onclick = async () => {
    try { await api.post('/auth/logout'); session = await api.get('/auth/session'); disposeDashboard(); login(); }
    catch (error) { app.querySelector('#main').textContent = error.message; }
  };
  const main = app.querySelector('#main');
  try {
    if (page === 'dashboard') await dashboard(main);
    else if (page === 'reports' && id === 'new') await newReport(main, new URLSearchParams(query).get('pass'));
    else if (page === 'reports' && id) await reportDetail(main, id, session.user);
    else if (page === 'reports') await reports(main, session.user);
    else if (['missions','troubles','users','operations'].includes(page)) await management(main, page);
    else if (['passes','satellite-data','space-weather'].includes(page)) await observations(main, page);
    else main.innerHTML = '<h1>Page not found</h1><a href="#dashboard">Dashboard</a>';
    if (version === routeVersion) document.title = 'Satellite Operations Information System';
  } catch (error) {
    if (version !== routeVersion) return;
    if (error.status === 401) { session = await api.get('/auth/session'); login(); return; }
    main.innerHTML = `<h1>Unable to load page</h1><p role="alert" class="error">${e(error.message)}</p><button id="retry" class="btn btn-mono-primary">Retry</button>`;
    main.querySelector('#retry').onclick = route;
  }
}
window.addEventListener('hashchange', route);
async function boot() {
  try { session = await api.get('/auth/session'); await route(); }
  catch (error) { document.body.className = 'auth-page'; app.innerHTML = `<main class="login-card"><h4>Unable to connect</h4><p role="alert">${e(error.message)}</p><button id="retry" class="btn btn-login">Retry</button></main>`; app.querySelector('#retry').onclick = boot; }
}
boot();

