import { Heart } from "lucide-react";

export default function Question(props) {
  return (
    <div className="border-accent dark:border-[#D9776D] border-2 rounded-xl p-6 sm:p-10 gap-4 sm:gap-5 flex flex-col bg-white dark:bg-neutral-800">
      <h1 className="text-black dark:text-white text-sm sm:text-base">
        This year, I really want to
      </h1>
      <div className="font-bold text-xl sm:text-3xl text-black dark:text-white">
        {props.answer}
      </div>
      <div className="border-2 border-brand bg-brand rounded-full w-fit p-2 hover:bg-brand/90 transition-colors">
        <Heart className="text-white w-5 h-5 sm:w-6 sm:h-6" />
      </div>
    </div>
  );
}
