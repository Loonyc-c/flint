"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { requestForgetPassword } from "@/features/auth/api/auth";
import {
  ForgetPasswordFormData,
  forgetPasswordSchema,
} from "@shared/validations";
import { ApiError } from "@/lib/api-client";
import { toast } from "react-toastify";
import Link from "next/link";
import { BottomGradient } from "@/utils";

import { AuthFormWrapper } from "./AuthFormWrapper";
import { FormInput } from "@/components/ui/form-input";

const ForgetPasswordForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<ForgetPasswordFormData>({
    resolver: zodResolver(forgetPasswordSchema),
  });

  const onSubmit = async (data: ForgetPasswordFormData) => {
    setIsLoading(true);

    try {
      await requestForgetPassword(data);
      setEmailSent(true);
      toast.success("Password reset email sent! Check your inbox.");
    } catch (err) {
      // Requirement 14: Removed detailed error logging
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

  if (emailSent) {
    return (
      <AuthFormWrapper title="Check Your Email">
        <div className="my-8 text-center">
          <p className="text-neutral-600 dark:text-neutral-400 mb-4">
            If an account exists with <strong>{getValues("email")}</strong>,
            you will receive a password reset link shortly.
          </p>
          <p className="text-sm text-neutral-500 dark:text-neutral-500 mb-6">
            Didn&apos;t receive the email? Check your spam folder or try again.
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

  return (
    <AuthFormWrapper
      title="Forgot Password?"
      subtitle="No worries! Enter your email and we'll send you a reset link."
    >
      <form className="my-8" onSubmit={handleSubmit(onSubmit)}>
        <FormInput
          id="forget-email"
          label="Email Address"
          placeholder="projectmayhem@fc.com"
          type="email"
          error={errors.email}
          disabled={isLoading}
          {...register("email")}
          containerClassName="mb-4"
        />

        <button
          className="group/btn relative block h-10 w-full rounded-md bg-linear-to-br from-brand-400 to-brand font-medium text-white shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:bg-zinc-800 dark:from-zinc-900 dark:to-zinc-900 dark:shadow-[0px_1px_0px_0px_#27272a_inset,0px_-1px_0px_0px_#27272a_inset] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          type="submit"
          disabled={isLoading}
        >
          Sending...
          <BottomGradient />
        </button>
      </form>

      <div className="text-center">
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

export default ForgetPasswordForm;
