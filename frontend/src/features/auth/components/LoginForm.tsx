"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { login } from "@/features/auth/api/auth";
import { LoginFormData, loginSchema } from "@shared/validations";
import { ApiError } from "@/lib/api-client";
import { toast } from "react-toastify";
import GoogleAuthButton from "./GoogleAuthButton";
import { AuthFormWrapper } from "./AuthFormWrapper";
import { FormInput } from "@/components/ui/form-input";
import { BottomGradient } from "@/utils";
import { useUser } from "../context/UserContext";

interface LoginFormProps {
  onSuccess?: () => void;
}

const LoginForm = ({ onSuccess }: LoginFormProps) => {
  const router = useRouter();
  const { login: setAuthToken } = useUser();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);

    try {
      const { accessToken } = await login(data);
      setAuthToken(accessToken);
      
      toast.success("Login successful!");
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/main");
      }
    } catch (err) {
      console.error("Login error:", err);
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthFormWrapper title="Log into Flint">
      <form className="my-8" onSubmit={handleSubmit(onSubmit)}>
        <FormInput
          id="login-email"
          label="Email Address"
          placeholder="projectmayhem@fc.com"
          type="email"
          error={errors.email}
          disabled={isLoading}
          {...register("email")}
          containerClassName="mb-4"
        />
        <FormInput
          id="login-password"
          label="Password"
          placeholder="••••••••"
          type="password"
          error={errors.password}
          disabled={isLoading}
          {...register("password")}
          containerClassName="mb-4"
        />

        <div className="mb-4 text-right">
          <Link
            href="/auth/forget-password"
            className="text-sm text-brand hover:text-brand-200 font-medium cursor-pointer"
          >
            Forgot Password?
          </Link>
        </div>

        <button
          className="group/btn relative block h-10 w-full rounded-md bg-linear-to-br from-brand-400 to-brand font-medium text-white shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:bg-zinc-800 dark:from-zinc-900 dark:to-zinc-900 dark:shadow-[0px_1px_0px_0px_#27272a_inset,0px_-1px_0px_0px_#27272a_inset] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? "Logging in..." : "Login →"}
          <BottomGradient />
        </button>

        <div className="bg-linear-to-r from-transparent via-neutral-300 dark:via-neutral-700 to-transparent my-8 h-px w-full" />

        <GoogleAuthButton />
      </form>
    </AuthFormWrapper>
  );
};

export default LoginForm;
