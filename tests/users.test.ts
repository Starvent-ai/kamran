import { describe, expect, it } from "vitest";
import { userActions } from "@/modules/security/useUsers";

describe("users", () => {
  it("rejects login before any user exists with that username", async () => {
    const result = await userActions.login("nonexistent-user", "whatever");
    expect(result.ok).toBe(false);
  });

  it("creates a user and allows login with the correct password only", async () => {
    const created = await userActions.createUser({
      fullName: "کاربر تست",
      username: "test-user-1",
      password: "secret123",
      role: "صندوقدار"
    });
    expect(created.ok).toBe(true);

    const wrongPassword = await userActions.login("test-user-1", "wrong");
    expect(wrongPassword.ok).toBe(false);

    const rightPassword = await userActions.login("test-user-1", "secret123");
    expect(rightPassword.ok).toBe(true);
    expect(userActions.getCurrentUserId()).not.toBeNull();

    userActions.logout();
    expect(userActions.getCurrentUserId()).toBeNull();
  });

  it("rejects creating a second user with a duplicate username", async () => {
    await userActions.createUser({
      fullName: "کاربر یک",
      username: "dup-user",
      password: "secret123",
      role: "تکنسین"
    });
    const second = await userActions.createUser({
      fullName: "کاربر دو",
      username: "dup-user",
      password: "another-pass",
      role: "انباردار"
    });
    expect(second.ok).toBe(false);
  });

  it("blocks login for a deactivated user", async () => {
    await userActions.createUser({
      fullName: "کاربر غیرفعال",
      username: "inactive-user",
      password: "secret123",
      role: "صندوقدار"
    });
    const user = userActions.getState().users.find((u) => u.username === "inactive-user")!;
    userActions.setActive(user.id, false);

    const result = await userActions.login("inactive-user", "secret123");
    expect(result.ok).toBe(false);
  });

  it("restricts role-based module access for non-manager roles", () => {
    expect(userActions.canAccess("مدیر", "accounting")).toBe(true);
    expect(userActions.canAccess("تکنسین", "accounting")).toBe(false);
    expect(userActions.canAccess("تکنسین", "repairs")).toBe(true);
  });

  it("does not carry the logged-in session in the persisted users state (only the roster persists)", async () => {
    await userActions.createUser({
      fullName: "کاربر سشن",
      username: "session-user",
      password: "secret123",
      role: "صندوقدار"
    });
    await userActions.login("session-user", "secret123");
    expect(userActions.getCurrentUserId()).not.toBeNull();

    // The persisted store only ever holds the roster — the logged-in user
    // id is deliberately kept in a separate, non-persisted store so a
    // restart always requires a fresh login.
    expect("currentUserId" in userActions.getState()).toBe(false);
  });
});
