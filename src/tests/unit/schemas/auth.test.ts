// Unit Test: 認証 Zod スキーマのバリデーション
// TDD: このテストが先に書かれており、src/schemas/auth.ts を実装してパスさせる。

import { describe, it, expect } from "vitest";
import { signUpSchema, signInSchema, resetPasswordSchema } from "@/schemas/auth";

// ===== signUpSchema =====

describe("signUpSchema", () => {
  it("有効な入力を受け付ける", () => {
    const result = signUpSchema.safeParse({
      email: "user@example.com",
      password: "password123",
      confirmPassword: "password123",
    });
    expect(result.success).toBe(true);
  });

  it("メールアドレスが無効な場合はエラー", () => {
    const result = signUpSchema.safeParse({
      email: "not-an-email",
      password: "password123",
      confirmPassword: "password123",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toContain("email");
  });

  it("メールアドレスが空の場合はエラー", () => {
    const result = signUpSchema.safeParse({
      email: "",
      password: "password123",
      confirmPassword: "password123",
    });
    expect(result.success).toBe(false);
  });

  it("パスワードが8文字未満の場合はエラー", () => {
    const result = signUpSchema.safeParse({
      email: "user@example.com",
      password: "short",
      confirmPassword: "short",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toContain("password");
  });

  it("パスワードが空の場合はエラー", () => {
    const result = signUpSchema.safeParse({
      email: "user@example.com",
      password: "",
      confirmPassword: "",
    });
    expect(result.success).toBe(false);
  });

  it("confirmPassword が password と一致しない場合はエラー", () => {
    const result = signUpSchema.safeParse({
      email: "user@example.com",
      password: "password123",
      confirmPassword: "different456",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toContain("confirmPassword");
  });

  it("confirmPassword が空の場合はエラー", () => {
    const result = signUpSchema.safeParse({
      email: "user@example.com",
      password: "password123",
      confirmPassword: "",
    });
    expect(result.success).toBe(false);
  });

  it("ちょうど8文字のパスワードは有効", () => {
    const result = signUpSchema.safeParse({
      email: "user@example.com",
      password: "12345678",
      confirmPassword: "12345678",
    });
    expect(result.success).toBe(true);
  });
});

// ===== signInSchema =====

describe("signInSchema", () => {
  it("有効な入力を受け付ける", () => {
    const result = signInSchema.safeParse({
      email: "user@example.com",
      password: "anypassword",
    });
    expect(result.success).toBe(true);
  });

  it("メールアドレスが無効な場合はエラー", () => {
    const result = signInSchema.safeParse({
      email: "invalid",
      password: "anypassword",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toContain("email");
  });

  it("パスワードが空の場合はエラー", () => {
    const result = signInSchema.safeParse({
      email: "user@example.com",
      password: "",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toContain("password");
  });

  it("signIn はパスワード長を検証しない（サーバー側エラーに委ねる）", () => {
    const result = signInSchema.safeParse({
      email: "user@example.com",
      password: "x",
    });
    expect(result.success).toBe(true);
  });
});

// ===== resetPasswordSchema =====

describe("resetPasswordSchema", () => {
  it("有効なメールアドレスを受け付ける", () => {
    const result = resetPasswordSchema.safeParse({
      email: "user@example.com",
    });
    expect(result.success).toBe(true);
  });

  it("無効なメールアドレスはエラー", () => {
    const result = resetPasswordSchema.safeParse({
      email: "not-an-email",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toContain("email");
  });

  it("空のメールアドレスはエラー", () => {
    const result = resetPasswordSchema.safeParse({ email: "" });
    expect(result.success).toBe(false);
  });
});
