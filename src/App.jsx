import securityVisual from "./assets/bsu-vault-security.png";
import { useMemo, useState } from "react";

const STORAGE_KEY = "company-password-manager-data-v2";
const SESSION_KEY = "company-password-manager-session";
const createId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const today = () => new Date().toISOString().slice(0, 10);
const daysAgo = (days) => { const d = new Date(); d.setDate(d.getDate() - days); return d.toISOString().slice(0, 10); };

const initialData = {
  users: [
    { id: "admin-1", name: "System Administrator", username: "admin", password: "Admin123!", role: "admin", active: true, createdAt: today() },
    { id: "employee-1", name: "Andreea Negoie", username: "anegoie", password: "Welcome123!", role: "employee", active: true, createdAt: today() }
  ],
  records: [
    { id: "record-1", userId: "employee-1", service: "Training Portal", accountUsername: "andreea.negoie", password: "Training2026!", notes: "Company training account", changedAt: daysAgo(86) }
  ]
};

function loadData() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
  return initialData;
}

function getDaysOld(dateText) {
  return Math.max(0, Math.floor((Date.now() - new Date(`${dateText}T00:00:00`).getTime()) / 86400000));
}

function getStatus(changedAt) {
  const days = getDaysOld(changedAt);
  if (days >= 90) return { label: "Overdue", className: "status overdue", days };
  if (days >= 80) return { label: "Due soon", className: "status due-soon", days };
  return { label: "Current", className: "status current", days };
}

function hasLongMatchingSequence(oldPassword, newPassword, maximum = 6) {
  for (let i = 0; i < oldPassword.length; i += 1) {
    for (let j = 0; j < newPassword.length; j += 1) {
      let count = 0;
      while (i + count < oldPassword.length && j + count < newPassword.length && oldPassword[i + count] === newPassword[j + count]) {
        count += 1;
        if (count > maximum) return true;
      }
    }
  }
  return false;
}

function Login({ data, onLogin }) {
  const [form, setForm] = useState({ username: "", password: "" });
  const [message, setMessage] = useState("");
  const submit = (event) => {
    event.preventDefault();
    const user = data.users.find((u) => u.username.toLowerCase() === form.username.trim().toLowerCase());
    if (!user || user.password !== form.password) return setMessage("The username or password is incorrect.");
    if (!user.active) return setMessage("This employee account has been deactivated.");
    setMessage(""); onLogin(user);
  };
  return <main className="login-page"><section className="login-layout">
    <div className="login-visual">
      <div className="login-brand"><span className="brand-mark">BSU</span><div><p className="eyebrow">Password Manager</p><h1>BSU VAULT</h1></div></div>
      <p className="hero-copy">Secure access. Simple password management.</p>
      <img className="security-visual" src={securityVisual} alt="Digital shield and password security illustration" />
    </div>
    <section className="login-card">
      <p className="eyebrow">Secure access</p><h2>Welcome back</h2>
      <p className="muted">Sign in to access your BSU VAULT.</p>
      <form onSubmit={submit} className="stack-form">
        <label>Username<input autoComplete="username" placeholder="Enter your username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /></label>
        <label>Password<input autoComplete="current-password" placeholder="Enter your password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>
        {message && <p className="message error">{message}</p>}<button className="primary-button login-button">Log in to BSU VAULT</button>
      </form>
      <div className="login-security-note">Protected access for authorised BSU users</div>
    </section>
  </section></main>;
}

function Header({ user, onLogout }) {
  return <header className="app-header"><div><p className="eyebrow">BSU VAULT</p><h1>{user.role === "admin" ? "Administrator area" : "My passwords"}</h1></div>
    <div className="header-user"><div><strong>{user.name}</strong><span>{user.role === "admin" ? "Administrator" : "Employee"}</span></div><button className="secondary-button" onClick={onLogout}>Log out</button></div></header>;
}

function Modal({ title, children, onClose }) {
  return <div className="modal-backdrop"><section className="modal"><div className="modal-header"><h2>{title}</h2><button className="icon-button" onClick={onClose}>×</button></div>{children}</section></div>;
}

function AdminDashboard({ data, setData }) {
  const [showCreate, setShowCreate] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ name: "", username: "", password: "" });
  const employees = data.users.filter((u) => u.role === "employee");
  const rows = employees.map((employee) => {
    const records = data.records.filter((r) => r.userId === employee.id);
    return { ...employee, recordCount: records.length, overdueCount: records.filter((r) => getStatus(r.changedAt).label === "Overdue").length };
  });
  const createEmployee = (event) => {
    event.preventDefault(); setMessage("");
    if (!form.name.trim() || !form.username.trim() || !form.password) return setMessage("Complete all fields.");
    if (form.password.length < 8) return setMessage("The temporary password must contain at least 8 characters.");
    if (data.users.some((u) => u.username.toLowerCase() === form.username.trim().toLowerCase())) return setMessage("That username already exists.");
    setData({ ...data, users: [...data.users, { id: createId(), name: form.name.trim(), username: form.username.trim(), password: form.password, role: "employee", active: true, createdAt: today() }] });
    setForm({ name: "", username: "", password: "" }); setShowCreate(false);
  };
  const toggle = (employee) => {
    if (!confirm(`Are you sure you want to ${employee.active ? "deactivate" : "reactivate"} this account?`)) return;
    setData({ ...data, users: data.users.map((u) => u.id === employee.id ? { ...u, active: !u.active } : u) });
  };
  const remove = (employee) => {
    if (employee.active) return alert("Deactivate the employee before deleting their account.");
    if (!confirm(`Permanently delete ${employee.name} and all their records?`)) return;
    setData({ users: data.users.filter((u) => u.id !== employee.id), records: data.records.filter((r) => r.userId !== employee.id) });
  };
  return <>
    <section className="summary-grid"><article className="summary-card"><span>Employees</span><strong>{employees.length}</strong></article><article className="summary-card"><span>Active accounts</span><strong>{employees.filter((e) => e.active).length}</strong></article><article className="summary-card"><span>Overdue records</span><strong>{rows.reduce((n, e) => n + e.overdueCount, 0)}</strong></article></section>
    <section className="panel"><div className="panel-heading"><div><p className="eyebrow">Employee management</p><h2>Employee accounts</h2></div><button className="primary-button" onClick={() => setShowCreate(true)}>Add employee</button></div>
      <div className="table-wrapper"><table><thead><tr><th>Employee</th><th>Username</th><th>Status</th><th>Created</th><th>Records</th><th>Overdue</th><th>Actions</th></tr></thead><tbody>{rows.map((employee) => <tr key={employee.id}><td>{employee.name}</td><td>{employee.username}</td><td><span className={employee.active ? "status current" : "status inactive"}>{employee.active ? "Active" : "Inactive"}</span></td><td>{employee.createdAt}</td><td>{employee.recordCount}</td><td>{employee.overdueCount}</td><td><div className="row-actions"><button className="text-button" onClick={() => toggle(employee)}>{employee.active ? "Deactivate" : "Reactivate"}</button><button className="text-button danger-text" onClick={() => remove(employee)}>Delete</button></div></td></tr>)}</tbody></table></div>
    </section><section className="notice"><strong>Privacy rule</strong><p>Administrators can see employee record counts and statuses, but cannot see stored password values.</p></section>
    {showCreate && <Modal title="Create employee account" onClose={() => setShowCreate(false)}><form className="stack-form" onSubmit={createEmployee}><label>Employee name<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label><label>Username<input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /></label><label>Temporary password<input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>{message && <p className="message error">{message}</p>}<div className="form-actions"><button type="button" className="secondary-button" onClick={() => setShowCreate(false)}>Cancel</button><button className="primary-button">Create employee</button></div></form></Modal>}
  </>;
}

function PasswordForm({ record, onSave, onClose }) {
  const [form, setForm] = useState(record ?? { service: "", accountUsername: "", password: "", notes: "" });
  const [message, setMessage] = useState("");
  const [show, setShow] = useState(false);
  const submit = (event) => {
    event.preventDefault();
    if (!form.service.trim() || !form.accountUsername.trim() || !form.password) return setMessage("Service, username and password are required.");
    if (form.password.length < 10) return setMessage("The password must contain at least 10 characters.");
    if (record && form.password !== record.password && hasLongMatchingSequence(record.password, form.password)) return setMessage("The new password contains more than 6 consecutive characters from the current password.");
    onSave(form);
  };
  return <Modal title={record ? "Edit password record" : "Add password record"} onClose={onClose}><form className="stack-form" onSubmit={submit}>
    <label>Website or service<input value={form.service} onChange={(e) => setForm({ ...form, service: e.target.value })} /></label>
    <label>Username or email<input value={form.accountUsername} onChange={(e) => setForm({ ...form, accountUsername: e.target.value })} /></label>
    <label>Password<div className="password-input"><input type={show ? "text" : "password"} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /><button type="button" className="text-button" onClick={() => setShow(!show)}>{show ? "Hide" : "Show"}</button></div></label>
    <label>Notes<textarea rows="3" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>
    {message && <p className="message error">{message}</p>}<div className="form-actions"><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button className="primary-button">Save record</button></div>
  </form></Modal>;
}

function EmployeeDashboard({ user, data, setData }) {
  const [search, setSearch] = useState(""); const [editing, setEditing] = useState(null); const [showForm, setShowForm] = useState(false); const [revealed, setRevealed] = useState([]);
  const records = useMemo(() => data.records.filter((r) => r.userId === user.id).filter((r) => r.service.toLowerCase().includes(search.toLowerCase())).sort((a, b) => a.service.localeCompare(b.service)), [data.records, search, user.id]);
  const overdue = records.filter((r) => getStatus(r.changedAt).label === "Overdue"); const dueSoon = records.filter((r) => getStatus(r.changedAt).label === "Due soon");
  const save = (form) => {
    if (editing) setData({ ...data, records: data.records.map((r) => r.id === editing.id ? { ...r, service: form.service.trim(), accountUsername: form.accountUsername.trim(), password: form.password, notes: form.notes.trim(), changedAt: form.password === editing.password ? editing.changedAt : today() } : r) });
    else setData({ ...data, records: [...data.records, { id: createId(), userId: user.id, service: form.service.trim(), accountUsername: form.accountUsername.trim(), password: form.password, notes: form.notes.trim(), changedAt: today() }] });
    setEditing(null); setShowForm(false);
  };
  const remove = (record) => { if (confirm(`Delete the password record for ${record.service}?`)) setData({ ...data, records: data.records.filter((r) => r.id !== record.id) }); };
  const copy = async (password) => { try { await navigator.clipboard.writeText(password); alert("Password copied."); } catch { alert("Clipboard access was blocked."); } };
  return <>
    {(overdue.length > 0 || dueSoon.length > 0) && <section className="reminder-banner"><strong>Password reminder</strong><p>{overdue.length > 0 && `${overdue.length} record(s) are overdue. `}{dueSoon.length > 0 && `${dueSoon.length} record(s) are due soon.`}</p></section>}
    <section className="summary-grid"><article className="summary-card"><span>Total records</span><strong>{records.length}</strong></article><article className="summary-card"><span>Due soon</span><strong>{dueSoon.length}</strong></article><article className="summary-card"><span>Overdue</span><strong>{overdue.length}</strong></article></section>
    <section className="panel"><div className="panel-heading"><div><p className="eyebrow">Personal vault</p><h2>Stored password records</h2></div><div className="toolbar"><input className="search-input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by service"/><button className="primary-button" onClick={() => { setEditing(null); setShowForm(true); }}>Add record</button></div></div>
      <div className="records-grid">{records.map((record) => { const status = getStatus(record.changedAt); const isShown = revealed.includes(record.id); return <article className="password-card" key={record.id}><div className="password-card-heading"><div><h3>{record.service}</h3><p>{record.accountUsername}</p></div><span className={status.className}>{status.label}</span></div><div className="record-field"><span>Password</span><strong>{isShown ? record.password : "•".repeat(Math.min(record.password.length, 16))}</strong></div><div className="record-field"><span>Last changed</span><strong>{record.changedAt} ({status.days} days ago)</strong></div>{record.notes && <div className="record-field"><span>Notes</span><p>{record.notes}</p></div>}<div className="card-actions"><button className="text-button" onClick={() => setRevealed(isShown ? revealed.filter((id) => id !== record.id) : [...revealed, record.id])}>{isShown ? "Hide" : "Show"}</button><button className="text-button" onClick={() => copy(record.password)}>Copy</button><button className="text-button" onClick={() => { setEditing(record); setShowForm(true); }}>Edit</button><button className="text-button danger-text" onClick={() => remove(record)}>Delete</button></div></article>; })}</div>
    </section>{showForm && <PasswordForm record={editing} onSave={save} onClose={() => { setShowForm(false); setEditing(null); }} />}
  </>;
}

export default function App() {
  const [data, setDataState] = useState(loadData);
  const [currentUser, setCurrentUser] = useState(() => data.users.find((u) => u.id === sessionStorage.getItem(SESSION_KEY)) ?? null);
  const setData = (next) => { setDataState(next); localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); };
  const login = (user) => { sessionStorage.setItem(SESSION_KEY, user.id); setCurrentUser(user); };
  const logout = () => { sessionStorage.removeItem(SESSION_KEY); setCurrentUser(null); };
  if (!currentUser) return <Login data={data} onLogin={login} />;
  const user = data.users.find((u) => u.id === currentUser.id) ?? currentUser;
  return <div className="app-shell"><Header user={user} onLogout={logout}/><main className="content">{user.role === "admin" ? <AdminDashboard data={data} setData={setData}/> : <EmployeeDashboard user={user} data={data} setData={setData}/>}</main><footer>BSU VAULT • Password Management System • Use fictional passwords only.</footer></div>;
}
