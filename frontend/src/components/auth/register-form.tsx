"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  GraduationCap,
  Plane,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { http, ApiError } from "@/lib/http";

interface SignupPayload {
  email: string;
  password: string;
  full_name: string;
  university_name: string;
}

export function RegisterForm() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [universityName, setUniversityName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [fullNameError, setFullNameError] = useState("");
  const [universityError, setUniversityError] = useState("");

  function validateEmail(value: string): boolean {
    if (!value) { setEmailError("Email is required."); return false; }
    if (!/^[^\s@]+@[^\s@]+\.edu(\.[a-z]{2,})?$/i.test(value)) {
      setEmailError("Only .edu or .edu.XX email addresses are accepted.");
      return false;
    }
    setEmailError("");
    return true;
  }

  function validatePassword(value: string): boolean {
    if (!value) { setPasswordError("Password is required."); return false; }
    if (value.length < 6) {
      setPasswordError("Password must be at least 6 characters.");
      return false;
    }
    setPasswordError("");
    return true;
  }

  function validateFullName(value: string): boolean {
    if (!value.trim()) { setFullNameError("Full name is required."); return false; }
    setFullNameError("");
    return true;
  }

  function validateUniversity(value: string): boolean {
    if (!value.trim()) { setUniversityError("University name is required."); return false; }
    setUniversityError("");
    return true;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const valid =
      validateEmail(email) &
      validatePassword(password) &
      validateFullName(fullName) &
      validateUniversity(universityName);
    if (!valid) return;

    setIsLoading(true);
    try {
      await http.post<{ message: string }>("/auth/signup", {
        email,
        password,
        full_name: fullName,
        university_name: universityName,
      } satisfies SignupPayload);
      setIsSuccess(true);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 400) {
          setEmailError(err.message);
        } else {
          setEmailError("Something went wrong. Please try again later.");
        }
      }
    } finally {
      setIsLoading(false);
    }
  }

  if (isSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 py-12">
        <div
          className="pointer-events-none fixed inset-0 -z-10"
          aria-hidden="true"
          style={{ background: "var(--gradient-hero)" }}
        />
        <div className="w-full max-w-[440px]">
          <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center" style={{ boxShadow: "var(--shadow-lg)" }}>
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="size-7 text-green-600" />
            </div>
            <h2 className="font-display text-2xl font-bold text-neutral-900">Check your inbox</h2>
            <p className="mt-2 text-sm text-neutral-500">
              We sent a verification email to <strong className="text-neutral-700">{email}</strong>.
              Click the link in the email to activate your account, then sign in.
            </p>
            <Button
              variant="primary"
              size="lg"
              className="mt-6 w-full"
              onClick={() => router.push("/login")}
            >
              Go to sign in
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 py-12">
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
              Create your account
            </h1>
            <p className="mt-1.5 text-sm text-neutral-500">
              Student travel planning, powered by AI
            </p>
          </div>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl border border-neutral-200 bg-white p-8"
          style={{ boxShadow: "var(--shadow-lg)" }}
        >
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
            <Input
              type="text"
              label="Full name"
              placeholder="Ada Lovelace"
              autoComplete="name"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                if (fullNameError) validateFullName(e.target.value);
              }}
              state={fullNameError ? "error" : "default"}
              hint={fullNameError || undefined}
              leftIcon={<User className="size-4" />}
            />

            <Input
              type="text"
              label="University name"
              placeholder="MIT"
              autoComplete="organization"
              value={universityName}
              onChange={(e) => {
                setUniversityName(e.target.value);
                if (universityError) validateUniversity(e.target.value);
              }}
              state={universityError ? "error" : "default"}
              hint={universityError || undefined}
              leftIcon={<GraduationCap className="size-4" />}
            />

            <Input
              type="email"
              label="University email address"
              placeholder="you@university.edu"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) validateEmail(e.target.value);
              }}
              state={emailError ? "error" : "default"}
              hint={emailError || "Must be a .edu email address"}
              leftIcon={<Mail className="size-4" />}
            />

            <Input
              type={showPassword ? "text" : "password"}
              label="Password"
              placeholder="••••••••"
              autoComplete="new-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (passwordError) validatePassword(e.target.value);
              }}
              state={passwordError ? "error" : "default"}
              hint={passwordError || "At least 6 characters"}
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
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="mt-1 w-full"
            >
              {isLoading ? "Creating account…" : "Create account"}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-neutral-500">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-sky-600 transition-colors hover:text-sky-700 focus-visible:outline-2 focus-visible:outline-sky-500 focus-visible:outline-offset-1 rounded"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
