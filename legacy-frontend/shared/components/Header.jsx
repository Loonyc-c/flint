import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "./button";
import Logo from "./logo";
import text_logo from "@/assets/text_logo.svg";
import { useAuthStore } from "@/features/auth";
import { LogOut, User } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import LanguageToggle from "./LanguageToggle";

function Header() {
  const { authUser, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header
      className="
        sticky top-0 z-50 w-full
        bg-white/90 dark:bg-neutral-900/90 backdrop-blur supports-[backdrop-filter]:bg-white/70 dark:supports-[backdrop-filter]:bg-neutral-900/70
        border-b border-neutral-200 dark:border-neutral-700
        px-5 py-4 flex items-center justify-between
        pt-[env(safe-area-inset-top)]
      "
    >
      <Link className="flex items-center gap-4" to="/">
        <Logo className="h-10" />
        <img
          src={text_logo}
          alt="Flint Logo"
          className="h-15 dark:brightness-90"
        />
      </Link>

      <nav className="text-sm">
        {authUser ? (
          <ul className="flex space-x-2 sm:space-x-4 items-center">
            {/* Language & Theme Toggles */}
            <li>
              <LanguageToggle />
            </li>
            <li>
              <ThemeToggle />
            </li>
            <li>
              <Link
                to="/profile-settings"
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                {authUser.profilePic ? (
                  <img
                    src={authUser.profilePic}
                    alt={authUser.fullName}
                    className="h-10 w-10 rounded-full object-cover border-2 border-brand hover:border-brand/70 transition-colors"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-brand/10 flex items-center justify-center hover:bg-brand/20 transition-colors">
                    <User className="h-6 w-6 text-brand" />
                  </div>
                )}
              </Link>
            </li>
            <li>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 rounded-md bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign out</span>
              </button>
            </li>
          </ul>
        ) : (
          <ul className="flex space-x-8 items-center">
            <li>
              <Link to="/login">Sign in</Link>
            </li>
            <li>
              <Link to="/main">
                <Button className="bg-brand hover:bg-brand-400">
                  Get Started
                </Button>
              </Link>
            </li>
          </ul>
        )}
      </nav>
    </header>
  );
}

export default Header;
