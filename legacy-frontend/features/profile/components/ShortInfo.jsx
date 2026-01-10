export default function ShortInfo(props) {
  return (
    <div
      className={`flex gap-2 sm:gap-3 items-center p-2 px-3 sm:px-5 h-full w-full ${
        props.border ? "border-r-2 border-accent dark:border-[#D9776D]" : ""
      }`}
    >
      {props.icon}
      <h1 className="text-black dark:text-white text-sm sm:text-lg flex">
        {props.text}
      </h1>
    </div>
  );
}
