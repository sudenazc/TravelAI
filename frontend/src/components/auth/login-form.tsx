"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Mail, Lock, Plane } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { http, ApiError } from "@/lib/http";

interface LoginPayload {
  email: string;
  password: string;
}

interface LoginResponse {
  access_token: string;
  token_type: string;
}

export function LoginForm() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  function validateEmail(value: string): boolean {
    if (!value) {
      setEmailError("Email is required.");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setEmailError("Please enter a valid email address.");
      return false;
    }
    setEmailError("");
    return true;
  }

  function validatePassword(value: string): boolean {
    if (!value) {
      setPasswordError("Password is required.");
      return false;
    }
    if (value.length < 6) {
      setPasswordError("Password must be at least 6 characters.");
      return false;
    }
    setPasswordError("");
    return true;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);
    if (!isEmailValid || !isPasswordValid) return;

    setIsLoading(true);
    try {
      await http.post<LoginResponse>("/auth/login", {
        email,
        password,
      } satisfies LoginPayload);
      router.push("/");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setPasswordError("Incorrect email or password. Please try again.");
      } else {
        setPasswordError("Something went wrong. Please try again later.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 py-12">
      {/* Background decoration */}
      <div
        className="pointer-events-none fixed inset-0 -z-10"
        aria-hidden="true"
        style={{ background: "var(--gradient-hero)" }}
      />

      <div className="w-full max-w-[440px]">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-full p-2 transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-sky-500 focus-visible:outline-offset-2"
            aria-label="Back to Travel AI home"
          >
            <div className="flex size-10 items-center justify-center rounded-full bg-sky-500">
              <Plane className="size-5 text-white" strokeWidth={2} />
            </div>
            <span className="font-display text-xl font-bold text-neutral-900">
              Travel<span className="text-sky-600">AI</span>
            </span>
          </Link>

          <div className="mt-2">
            <h1 className="font-display text-[28px] font-bold leading-tight text-neutral-900 lg:text-[32px]">
              Welcome back
            </h1>
            <p className="mt-1.5 text-sm text-neutral-500">
              Sign in to continue planning your perfect trip
            </p>
          </div>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl border border-neutral-200 bg-white p-8"
          style={{ boxShadow: "var(--shadow-lg)" }}
        >
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
            {/* Email */}
            <Input
              type="email"
              label="Email address"
              placeholder="you@example.com"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) validateEmail(e.target.value);
              }}
              state={emailError ? "error" : "default"}
              hint={emailError || undefined}
              leftIcon={<Mail className="size-4" />}
              aria-describedby={emailError ? "email-error" : undefined}
            />

            {/* Password */}
            <Input
              type={showPassword ? "text" : "password"}
              label="Password"
              placeholder="••••••••"
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (passwordError) validatePassword(e.target.value);
              }}
              state={passwordError ? "error" : "default"}
              hint={passwordError || undefined}
              leftIcon={<Lock className="size-4" />}
              rightSlot={
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="flex size-8 items-center justify-center rounded-md text-neutral-400 transition-colors hover:text-neutral-700 focus-visible:outline-2 focus-visible:outline-sky-500"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              }
              aria-describedby={passwordError ? "password-error" : undefined}
            />

            {/* Forgot password */}
            <div className="-mt-1 flex justify-end">
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-sky-600 transition-colors hover:text-sky-700 focus-visible:outline-2 focus-visible:outline-sky-500 focus-visible:outline-offset-1 rounded"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="mt-1 w-full"
            >
              {isLoading ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-neutral-200" />
            <span className="text-xs font-medium text-neutral-400">OR</span>
            <div className="h-px flex-1 bg-neutral-200" />
          </div>

          {/* Social login placeholder */}
          <Button
            type="button"
            variant="secondary"
            size="lg"
            className="w-full gap-3"
          >
            <svg viewBox="0 0 24 24" className="size-4 shrink-0" aria-hidden="true">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </Button>
        </div>

        {/* Sign up link */}
        <p className="mt-6 text-center text-sm text-neutral-500">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-semibold text-sky-600 transition-colors hover:text-sky-700 focus-visible:outline-2 focus-visible:outline-sky-500 focus-visible:outline-offset-1 rounded"
          >
            Create one free
          </Link>
        </p>
      </div>
    </div>
  );
}
