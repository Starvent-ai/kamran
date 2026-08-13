import { describe, expect, it } from "vitest";
import { sha256Hex } from "@/lib/hash";

describe("sha256Hex", () => {
  it("matches the known SHA-256 digest of the empty string", () => {
    expect(sha256Hex("")).toBe("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
  });

  it("matches the canonical NIST test vector for 'abc'", () => {
    expect(sha256Hex("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  });

  it("matches a known reference digest for 'hello'", () => {
    expect(sha256Hex("hello")).toBe("2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824");
  });

  it("produces different digests for different inputs", () => {
    expect(sha256Hex("password1")).not.toBe(sha256Hex("password2"));
  });

  it("is deterministic for the same input, including multi-byte UTF-8 text", () => {
    expect(sha256Hex("همان رمز")).toBe(sha256Hex("همان رمز"));
  });

  it("handles input spanning multiple 64-byte blocks", () => {
    const digest = sha256Hex("a".repeat(1000));
    expect(digest).toBe("41edece42d63e8d9bf515a9ba6932e1c20cbc9f5a5d134645adb5db1b9737ea3");
  });
});
