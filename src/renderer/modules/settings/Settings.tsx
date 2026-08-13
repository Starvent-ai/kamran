import { useEffect, useState } from "react";
import { StoreSettings } from "./StoreSettings";

const PROVIDERS = ["OpenAI", "Claude", "Gemini", "Grok", "OpenRouter", "DeepSeek", "Mistral"] as const;
type Provider = (typeof PROVIDERS)[number];

const SETTINGS_KEY = "ai-provider-config";

interface AiProviderConfig {
  provider: Provider;
  apiKey: string;
}

async function loadConfig(): Promise<AiProviderConfig> {
  if (window.starvent) {
    const saved = (await window.starvent.settings.get(SETTINGS_KEY)) as AiProviderConfig | undefined;
    return saved ?? { provider: "OpenAI", apiKey: "" };
  }
  const raw = localStorage.getItem(SETTINGS_KEY);
  return raw ? (JSON.parse(raw) as AiProviderConfig) : { provider: "OpenAI", apiKey: "" };
}

async function saveConfig(config: AiProviderConfig): Promise<void> {
  if (window.starvent) {
    await window.starvent.settings.set(SETTINGS_KEY, config);
    return;
  }
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(config));
}

export function Settings(): JSX.Element {
  const [provider, setProvider] = useState<Provider>("OpenAI");
  const [apiKey, setApiKey] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "saved">("loading");

  useEffect(() => {
    let cancelled = false;
    loadConfig().then((config) => {
      if (cancelled) return;
      setProvider(config.provider);
      setApiKey(config.apiKey);
      setStatus("idle");
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSave(): Promise<void> {
    await saveConfig({ provider, apiKey });
    setStatus("saved");
    setTimeout(() => setStatus("idle"), 1800);
  }

  return (
    <div>
      <div className="card">
        <h3 style={{ marginTop: 0 }}>پیکربندی هوش مصنوعی</h3>
        <p style={{ color: "var(--sv-text-600)", marginTop: 0 }}>
          کلید API انتخابی به‌صورت محلی و رمزنگاری‌شده روی سیستم شما ذخیره می‌شود و هرگز به سرور دیگری ارسال نمی‌شود.
        </p>
        <div className="form-row">
          <div>
            <label htmlFor="ai-provider">ارائه‌دهنده هوش مصنوعی</label>
            <select id="ai-provider" value={provider} onChange={(e) => setProvider(e.target.value as Provider)}>
              {PROVIDERS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="ai-key">API Key</label>
            <input
              id="ai-key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              disabled={status === "loading"}
            />
          </div>
        </div>
        <button type="button" className="btn-primary" onClick={handleSave} disabled={status === "loading"}>
          ذخیره تنظیمات
        </button>
        {status === "saved" ? (
          <span style={{ marginInlineStart: 12, color: "var(--sv-success)" }}>ذخیره شد.</span>
        ) : null}
      </div>

      <StoreSettings />

      <div className="card" style={{ marginTop: 24 }}>
        <h3 style={{ marginTop: 0 }}>دربارهٔ برنامه</h3>
        <p style={{ color: "var(--sv-text-400)" }}>
          Starvent
        </p>
        <p
          style={{
            color: "var(--sv-gold-300)",
            borderInlineStart: "2px solid var(--sv-gold-700)",
            paddingInlineStart: "var(--sv-space-3)",
            marginBottom: 0
          }}
        >
          آینده را طراحی می‌کند؛ با تلفیق هوش مصنوعی، فناوری و تفکر استراتژیک، ایده‌ها را به محصولات ماندگار
          تبدیل می‌کنیم.
        </p>
      </div>
    </div>
  );
}
