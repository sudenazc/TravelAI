import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Create Account",
  description: "Sign up with your university email to start planning trips with Travel AI.",
};

export default function RegisterPage() {
  return <RegisterForm />;
}
