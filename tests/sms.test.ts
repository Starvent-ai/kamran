import { describe, expect, it, vi, afterEach } from "vitest";
import { sendSms } from "../src/main/smsSend";
import type { SmsGatewayConfig } from "@shared/types";

const baseConfig: SmsGatewayConfig = {
  endpoint: "https://example-panel.test/send",
  method: "GET",
  apiKey: "test-key",
  senderNumber: "3000",
  params: [
    { id: "p1", key: "apikey", valueTemplate: "{apikey}" },
    { id: "p2", key: "receptor", valueTemplate: "{phone}" },
    { id: "p3", key: "message", valueTemplate: "{message}" }
  ]
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("sendSms", () => {
  it("returns an error when no endpoint is configured", async () => {
    const result = await sendSms({ ...baseConfig, endpoint: "" }, "09121234567", "test");
    expect(result.ok).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it("substitutes placeholders into GET query params and calls fetch", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);

    const result = await sendSms(baseConfig, "09121234567", "پیام تست");

    expect(result.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const calledUrl = new URL(fetchMock.mock.calls[0][0] as string);
    expect(calledUrl.searchParams.get("apikey")).toBe("test-key");
    expect(calledUrl.searchParams.get("receptor")).toBe("09121234567");
    expect(calledUrl.searchParams.get("message")).toBe("پیام تست");
  });

  it("sends a POST body instead of query params when method is POST", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);

    await sendSms({ ...baseConfig, method: "POST" }, "09121234567", "پیام دوم");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(baseConfig.endpoint);
    expect(options.method).toBe("POST");
    const body = JSON.parse(options.body as string);
    expect(body.receptor).toBe("09121234567");
    expect(body.message).toBe("پیام دوم");
  });

  it("reports a gateway error response instead of throwing", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 403 }));
    const result = await sendSms(baseConfig, "09121234567", "test");
    expect(result.ok).toBe(false);
    expect(result.error).toContain("403");
  });

  it("catches a network failure and returns it as a result instead of throwing", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));
    const result = await sendSms(baseConfig, "09121234567", "test");
    expect(result.ok).toBe(false);
    expect(result.error).toBe("network down");
  });
});
