import { useState, type FormEvent } from "react";
import { useUsers } from "./useUsers";
import { useActivityLog } from "./useActivityLog";
import type { UserRole } from "@shared/types";

const ROLES: UserRole[] = ["مدیر", "صندوقدار", "تکنسین", "انباردار"];

export function Security(): JSX.Element {
  const { users, currentUser, createUser, setActive, login, logout } = useUsers();
  const { entries } = useActivityLog();

  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("صندوقدار");
  const [createError, setCreateError] = useState<string | null>(null);

  async function handleLogin(event: FormEvent): Promise<void> {
    event.preventDefault();
    setLoginError(null);
    const result = await login(loginUsername.trim(), loginPassword);
    if (!result.ok) setLoginError(result.error ?? "خطای نامشخص");
    else {
      setLoginUsername("");
      setLoginPassword("");
    }
  }

  async function handleCreateUser(event: FormEvent): Promise<void> {
    event.preventDefault();
    setCreateError(null);
    if (!fullName.trim() || !username.trim() || password.length < 4) {
      setCreateError("نام، نام کاربری الزامی است و رمز عبور باید حداقل ۴ کاراکتر باشد");
      return;
    }
    const result = await createUser({ fullName: fullName.trim(), username: username.trim(), password, role });
    if (!result.ok) setCreateError(result.error ?? "خطای نامشخص");
    else {
      setFullName("");
      setUsername("");
      setPassword("");
      setRole("صندوقدار");
    }
  }

  return (
    <div>
      <div className="card">
        <h3 style={{ marginTop: 0 }}>وضعیت ورود</h3>
        <p style={{ color: "var(--sv-text-600)", marginTop: 0 }}>
          دسترسی به بخش‌های مختلف برنامه بر اساس سطح دسترسی (نقش) هر کاربر واقعاً اعمال می‌شود —
          کاربری که وارد شده فقط بخش‌هایی از نوار کناری را می‌بیند که نقشش اجازهٔ آن را دارد.
        </p>
        {currentUser ? (
          <div>
            <p>
              کاربر فعال: <strong>{currentUser.fullName}</strong> ({currentUser.role})
            </p>
            <button type="button" className="btn-secondary" onClick={logout}>
              خروج
            </button>
          </div>
        ) : (
          <form onSubmit={handleLogin}>
            <div className="form-row">
              <div>
                <label htmlFor="login-username">نام کاربری</label>
                <input id="login-username" value={loginUsername} onChange={(e) => setLoginUsername(e.target.value)} />
              </div>
              <div>
                <label htmlFor="login-password">رمز عبور</label>
                <input
                  id="login-password"
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                />
              </div>
            </div>
            {loginError ? <p style={{ color: "var(--sv-warning)" }}>{loginError}</p> : null}
            <button type="submit" className="btn-primary">
              ورود
            </button>
          </form>
        )}
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <h3 style={{ marginTop: 0 }}>ایجاد کاربر جدید</h3>
        <form onSubmit={handleCreateUser}>
          <div className="form-row">
            <div>
              <label htmlFor="new-fullname">نام کامل</label>
              <input id="new-fullname" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div>
              <label htmlFor="new-username">نام کاربری</label>
              <input id="new-username" value={username} onChange={(e) => setUsername(e.target.value)} />
            </div>
            <div>
              <label htmlFor="new-password">رمز عبور</label>
              <input id="new-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div>
              <label htmlFor="new-role">سطح دسترسی</label>
              <select id="new-role" value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {createError ? <p style={{ color: "var(--sv-warning)" }}>{createError}</p> : null}
          <button type="submit" className="btn-primary">
            ایجاد کاربر
          </button>
        </form>
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <h3 style={{ marginTop: 0 }}>کاربران</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>نام</th>
              <th>نام کاربری</th>
              <th>سطح دسترسی</th>
              <th>وضعیت</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.fullName}</td>
                <td>{u.username}</td>
                <td>{u.role}</td>
                <td>
                  <button type="button" className="btn-secondary" onClick={() => setActive(u.id, !u.active)}>
                    {u.active ? "غیرفعال کردن" : "فعال کردن"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <h3 style={{ marginTop: 0 }}>لاگ فعالیت</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>زمان</th>
              <th>کاربر</th>
              <th>رویداد</th>
              <th>جزئیات</th>
            </tr>
          </thead>
          <tbody>
            {entries
              .slice()
              .reverse()
              .map((entry) => (
                <tr key={entry.id}>
                  <td>{new Date(entry.timestamp).toLocaleString("fa-IR")}</td>
                  <td>{entry.userLabel}</td>
                  <td className={entry.level === "error" ? "data-table__low-stock" : undefined}>{entry.action}</td>
                  <td>{entry.details}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
