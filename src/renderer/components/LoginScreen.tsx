import { useState, type FormEvent } from "react";
import { useUsers } from "@/modules/security/useUsers";
import logo from "@/assets/icon.png";

/**
 * Shown instead of the app shell whenever at least one user account exists
 * and nobody is currently logged in — this is what actually makes the
 * "کاربران و سطح دسترسی" module mean something, instead of just being a
 * log. A shop with zero accounts still opens straight into the app (see
 * App.tsx) so nobody is ever locked out of a fresh install before they've
 * had a chance to create the first admin account from داخل settings.
 */
export function LoginScreen(): JSX.Element {
  const { login } = useUsers();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent): Promise<void> {
    event.preventDefault();
    setError(null);
    setBusy(true);
    const result = await login(username.trim(), password);
    setBusy(false);
    if (!result.ok) {
      setError(result.error ?? "خطای نامشخص");
      return;
    }
    setUsername("");
    setPassword("");
  }

  return (
    <div className="login-screen">
      <form className="login-screen__card" onSubmit={handleSubmit}>
        <img src={logo} alt="Starvent" className="login-screen__logo" />
        <h1 className="login-screen__title">ورود به Starvent</h1>
        <div>
          <label htmlFor="gate-username">نام کاربری</label>
          <input
            id="gate-username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
            autoComplete="username"
          />
        </div>
        <div>
          <label htmlFor="gate-password">رمز عبور</label>
          <input
            id="gate-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>
        {error ? <p style={{ color: "var(--sv-warning)" }}>{error}</p> : null}
        <button type="submit" className="btn-primary" disabled={busy}>
          {busy ? "در حال ورود..." : "ورود"}
        </button>
      </form>
    </div>
  );
}
