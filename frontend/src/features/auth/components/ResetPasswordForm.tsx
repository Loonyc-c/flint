"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { resetPassword } from "@/features/auth/api/auth";
import {
  ResetPasswordFormData,
  resetPasswordSchema,
} from "@shared/validations";
import { ApiError } from "@/lib/api-client";
import { toast } from "react-toastify";
import Link from "next/link";
import { BottomGradient } from "@/utils";

import { AuthFormWrapper } from "./AuthFormWrapper";
import { FormInput } from "@/components/ui/form-input";

const ResetPasswordForm = () => {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [isLoading, setIsLoading] = useState(false);
  const [passwordResetSuccess, setPasswordResetSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      toast.error("Password reset token is missing.");
      return;
    }

    setIsLoading(true);

    try {
      await resetPassword(token, {
        password: data.password,
        confirmPassword: data.confirmPassword,
      });
      setPasswordResetSuccess(true);
      toast.success("Your password has been reset successfully!");
    } catch (err) {
      console.error("Password reset error:", err);
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

  if (passwordResetSuccess) {
    return (
      <AuthFormWrapper title="Password Reset Successful!">
        <div className="my-8 text-center">
          <p className="text-neutral-600 dark:text-neutral-400 mb-4">
            Your password has been updated. You can now log in with your new
            password.
          </p>
          <Link
            href="/auth"
            className="text-sm text-brand hover:text-brand-200 font-medium cursor-pointer inline-block"
          >
            ← Back to Login
          </Link>
        </div>
      </AuthFormWrapper>
    );
  }

  if (!token) {
    return (
      <AuthFormWrapper title="Invalid or Missing Token">
        <div className="my-8 text-center">
          <p className="text-neutral-600 dark:text-neutral-400 mb-4">
            The password reset link is invalid or has expired. Please request a
            new one.
          </p>
          <Link
            href="/auth/forget-password"
            className="text-sm text-brand hover:text-brand-200 font-medium cursor-pointer inline-block"
          >
            Request New Reset Link
          </Link>
          <Link
            href="/auth"
            className="text-sm text-brand hover:text-brand-200 font-medium cursor-pointer inline-block mt-4 ml-4"
          >
            ← Back to Login
          </Link>
        </div>
      </AuthFormWrapper>
    );
  }

  return (
    <AuthFormWrapper
      title="Reset Your Password"
      subtitle="Enter your new password below."
    >
      <form className="my-8" onSubmit={handleSubmit(onSubmit)}>
        <FormInput
          id="password"
          label="New Password"
          placeholder="••••••••"
          type="password"
          error={errors.password}
          disabled={isLoading}
          {...register("password")}
          containerClassName="mb-4"
        />
        <FormInput
          id="confirmPassword"
          label="Confirm New Password"
          placeholder="••••••••"
          type="password"
          error={errors.confirmPassword}
          disabled={isLoading}
          {...register("confirmPassword")}
          containerClassName="mb-8"
        />

        <button
          className="group/btn relative block h-10 w-full rounded-md bg-linear-to-br from-brand-400 to-brand font-medium text-white shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:bg-zinc-800 dark:from-zinc-900 dark:to-zinc-900 dark:shadow-[0px_1px_0px_0px_#27272a_inset,0px_-1px_0px_0px_#27272a_inset] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? "Resetting..." : "Reset Password →"}
          <BottomGradient />
        </button>
      </form>

      <div className="text-center mt-4">
        <Link
          href="/auth"
          className="text-sm text-brand hover:text-brand-200 font-medium cursor-pointer"
        >
          ← Back to Login
        </Link>
      </div>
    </AuthFormWrapper>
  );
};

export default ResetPasswordForm;
