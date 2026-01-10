export default function SocialMediaBttn(props) {
  return (
    <div className="flex gap-30 border-accent w-full border-2 rounded-xl p-5 pr-30 justify-start">
      <div>{props.logo}</div>
      <div>
        <h1>{props.name}</h1>
        <p>{props.media}</p>
      </div>
    </div>
  );
}
