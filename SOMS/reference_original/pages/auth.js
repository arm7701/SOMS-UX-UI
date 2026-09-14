import { api } from '../api.js';
import { submitForm } from '../components.js';
import { validatePassword } from '../model.js';
export function renderAuth(app, session, onSession) {
  const setup = session?.setupRequired;
  const input = (name, label, type, placeholder = '') => `<div class="mb-3"><label class="form-label" for="${name}">${label}</label><input id="${name}" name="${name}" type="${type}" class="form-control" ${placeholder ? `placeholder="${placeholder}"` : ''} ${setup || name === 'username' ? 'required' : ''} autocomplete="${type === 'password' ? setup ? 'new-password' : 'current-password' : 'off'}"></div>`;
  app.innerHTML = `<main id="main" class="${setup ? 'setup-card' : 'login-card'}">${setup ? '<h4 class="text-info text-center mb-4">ตั้งรหัสผ่าน</h4>' : '<div class="text-center mb-3"><i class="bi bi-rocket-takeoff fs-2 text-info"></i></div><h4 class="login-title">Satellite Operations Information System</h4>'}<form><p role="alert" tabindex="-1" class="error"></p>${setup ? '' : input('username', 'Username', 'text', 'Enter username (ไม่ต้องใส่ @rtaf.mi.th)')}${input('password', setup ? 'รหัสผ่านใหม่' : 'Password', 'password', setup ? '' : 'Enter password หรือเว้นไว้ถ้ายังไม่เคยตั้งรหัสผ่าน')}${setup ? input('confirmPassword', 'ยืนยันรหัสผ่าน', 'password') : ''}<button type="submit" class="btn ${setup ? 'btn-info w-100' : 'btn-login'}">${setup ? 'บันทึกรหัสผ่าน' : '<i class="bi bi-box-arrow-in-right me-1"></i> Login'}</button></form>${setup ? '<div class="text-center mt-3"><a href="#login" id="back-login" class="text-info text-decoration-none">กลับหน้า Login</a></div>' : `<div class="login-footer">© ${new Date().getFullYear()} SPACE <br>intelligence surveillance and reconnaissance : ISR</div>`}</main>`;
  if (setup) app.querySelector('#back-login').onclick = async event => { event.preventDefault(); await api.post('/auth/logout'); await onSession(await api.get('/auth/session')); };
  submitForm(app.querySelector('form'), async form => {
    if (setup && form.get('password') !== form.get('confirmPassword')) throw new Error('รหัสผ่านทั้งสองช่องไม่ตรงกัน');
    if (setup) validatePassword(String(form.get('password')));
    const next = await api.post(setup ? '/auth/setup-password' : '/auth/login', setup ? {password: form.get('password')} : {username: form.get('username'), password: form.get('password')});
    await onSession(next);
  });
}
