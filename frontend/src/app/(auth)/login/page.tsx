import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your Travel AI account and continue planning your perfect trip.",
};

export default function LoginPage() {
  return <LoginForm />;
}
