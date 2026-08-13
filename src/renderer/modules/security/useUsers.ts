import { createStore } from "@/state/createStore";
import { sha256Hex } from "@/lib/hash";
import { activityLogActions } from "./useActivityLog";
import type { AppUser, UserRole } from "@shared/types";
import { generateId } from "@/lib/id";

interface UsersState {
  users: AppUser[];
}

// The user roster (accounts, roles, password hashes) is persisted — it's
// real business data. Who is currently logged in is deliberately NOT
// persisted (no persistKey): every app launch should require a fresh
// login, not silently resume the previous session.
const usersStore = createStore<UsersState>({ users: [] }, "data-users");
const sessionStore = createStore<{ currentUserId: string | null }>({ currentUserId: null });

interface CreateUserInput {
  fullName: string;
  username: string;
  password: string;
  role: UserRole;
}

async function createUser(input: CreateUserInput): Promise<{ ok: boolean; error?: string }> {
  const state = usersStore.getState();
  if (state.users.some((u) => u.username === input.username)) {
    return { ok: false, error: "این نام کاربری قبلاً استفاده شده است" };
  }
  const passwordHash = sha256Hex(input.password);
  const user: AppUser = {
    id: generateId("usr"),
    fullName: input.fullName,
    username: input.username,
    passwordHash,
    role: input.role,
    active: true,
    createdAt: new Date().toISOString()
  };
  usersStore.setState((prev) => ({ ...prev, users: [...prev.users, user] }));
  activityLogActions.logActivity(currentUserLabel(), "ایجاد کاربر", `کاربر جدید: ${input.username} (${input.role})`);
  return { ok: true };
}

function setActive(userId: string, active: boolean): void {
  usersStore.setState((prev) => ({
    ...prev,
    users: prev.users.map((u) => (u.id === userId ? { ...u, active } : u))
  }));
  const target = usersStore.getState().users.find((u) => u.id === userId);
  activityLogActions.logActivity(
    currentUserLabel(),
    active ? "فعال‌سازی کاربر" : "غیرفعال‌سازی کاربر",
    target?.username ?? userId
  );
}

async function login(username: string, password: string): Promise<{ ok: boolean; error?: string }> {
  const passwordHash = sha256Hex(password);
  const state = usersStore.getState();
  const user = state.users.find((u) => u.username === username && u.active);

  if (!user || user.passwordHash !== passwordHash) {
    activityLogActions.logActivity(username || "ناشناس", "ورود ناموفق", "نام کاربری یا رمز عبور نادرست", "error");
    return { ok: false, error: "نام کاربری یا رمز عبور نادرست است" };
  }

  sessionStore.setState(() => ({ currentUserId: user.id }));
  activityLogActions.logActivity(`${user.fullName} (${user.username})`, "ورود", "ورود موفق به برنامه");
  return { ok: true };
}

function logout(): void {
  const label = currentUserLabel();
  sessionStore.setState(() => ({ currentUserId: null }));
  activityLogActions.logActivity(label, "خروج", "خروج از برنامه");
}

function currentUserLabel(): string {
  const usersState = usersStore.getState();
  const { currentUserId } = sessionStore.getState();
  const user = usersState.users.find((u) => u.id === currentUserId);
  return user ? `${user.fullName} (${user.username})` : "سیستم";
}

/** Role -> allowed section ids. "مدیر" always has full access. */
const ROLE_ACCESS: Record<UserRole, string[] | "all"> = {
  مدیر: "all",
  صندوقدار: ["dashboard", "sales", "customers", "calculator", "printing"],
  تکنسین: ["dashboard", "repairs", "printing"],
  انباردار: ["dashboard", "inventory", "warehouse", "suppliers"]
};

function canAccess(role: UserRole, moduleId: string): boolean {
  const allowed = ROLE_ACCESS[role];
  return allowed === "all" || allowed.includes(moduleId);
}

export function useUsers() {
  const state = usersStore.useStore();
  const { currentUserId } = sessionStore.useStore();
  const currentUser = state.users.find((u) => u.id === currentUserId) ?? null;
  return {
    users: state.users,
    currentUser,
    createUser,
    setActive,
    login,
    logout,
    canAccess
  };
}

export const userActions = {
  createUser,
  setActive,
  login,
  logout,
  canAccess,
  getState: usersStore.getState,
  getCurrentUserId: () => sessionStore.getState().currentUserId
};
