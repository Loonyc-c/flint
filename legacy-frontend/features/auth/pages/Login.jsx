"use client";
import React from "react";
import { Tabs } from "@/shared/components/ui/tabs";
import SignupFormDemo from "@/features/auth/components/SignupForm";
import LoginFormDemo from "@/features/auth/components/LoginForm";

export default function Login() {
  const tabs = [
    {
      title: "Login",
      value: "Login",
      content: <LoginFormDemo />,
    },
    {
      title: "SignUp",
      value: "SignUp",
      content: <SignupFormDemo />,
    },
  ];

  return (
    <div className="p-10 flex justify-center items-center  h-fit">
      <div className=" [perspective:1000px] relative flex flex-col max-w-5xl justify-center items-center w-full   ">
        <Tabs tabs={tabs} />
      </div>
    </div>
  );
}
