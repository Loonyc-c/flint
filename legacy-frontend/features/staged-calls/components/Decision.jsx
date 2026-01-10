import { Link } from "react-router-dom";
import { CircleCheck, CircleX, Video, VideoOff } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Decision(props) {
  const navigate = useNavigate();
  const [countDown, setCountDown] = useState(10);

  useEffect(() => {
    if (countDown <= 0) {
      navigate("/main");
      return;
    }

    const t = setTimeout(() => {
      setCountDown((v) => v - 1);
    }, 1000);

    return () => clearTimeout(t);
  }, [countDown, navigate]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center gap-10 z-100">
      <div className="text-white text-9xl">{countDown}</div>
      <div className="bg-white p-6 rounded-lg text-center shadow-lg">
        <h2 className="text-2xl font-bold mb-2">Decision Time</h2>
        <p className="mb-4">Decide</p>
        <Link
          to={props.link}
          className="flex justify-center items-center px-5 py-2 bg-gray-300  text-white rounded-md hover:bg-brand transition-colors"
        >
          <CircleCheck className="text-green-600 " />
        </Link>

        <br />

        <Link
          to="/main"
          className="flex justify-center items-center px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-colors"
        >
          <CircleX className="text-brand" />
        </Link>
      </div>
    </div>
  );
}
