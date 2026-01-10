import { useEffect, useState } from "react";
import Logo from "@/assets/logo.svg";

export default function HeaderStage({ onTimeUp, expiresAt, name }) {
  const [time, setTime] = useState(0);

  useEffect(() => {
    // Calculate remaining time based on server timestamp
    const calculateTimeLeft = () => {
      if (!expiresAt) return 0;

      const now = Date.now();
      const expiry = new Date(expiresAt).getTime();
      const remaining = Math.max(0, Math.floor((expiry - now) / 1000));

      return remaining;
    };

    // Initial calculation
    setTime(calculateTimeLeft());

    // Update every second
    const interval = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTime(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        onTimeUp?.();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onTimeUp]);

  const minutes = Math.floor(time / 60);
  const seconds = time % 60;
  const isValidTime = !isNaN(minutes) && !isNaN(seconds);

  // Always show 2 digits for seconds
  const formattedTime = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  return (
    <header className="h-[92px] flex items-center justify-between px-10 shadow-2xl shadow-accnte">
      <div className="flex gap-10 items-center">
        <div className="flex items-center gap-5">
          <div className="bg-brand h-3 w-3 rounded-full"></div>
          <h1 className="">Stage {name}</h1>
        </div>
        <div className="flex gap-2 items-center">
          {isValidTime && (
            <div className="border-2 px-3 rounded-full text-brand font-extralight border-brand">
              {formattedTime}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <h1>Profile</h1>
        <div className="border-brand border-2 rounded-full p-2 h-10 w-10 ">
          <img src={Logo} alt="" className="" />
        </div>
      </div>
    </header>
  );
}
