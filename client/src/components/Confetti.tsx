import { useEffect, useState } from "react";
import "./Confetti.scss";

const emojis: string[] = ["🎉", "🎊", "✨", "❤️", "😊", "🥳", "🌟", "🎈"];

export default function Confetti() {
  const getRandomEmoji = (): string => {
    const randomIndex = Math.floor(Math.random() * emojis.length);
    return emojis[randomIndex];
  };

  const [confetti, setConfetti] = useState<
    { id: number; emoji: string; top: number; left: number }[]
  >([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const newConfetti = [...confetti];
      const id = Date.now();
      const emoji = getRandomEmoji();
      const left = Math.random() * window.innerWidth;
      const top = -50;
      newConfetti.push({ id, emoji, top, left });
      setConfetti(newConfetti);

      setTimeout(() => {
        setConfetti((prevConfetti) =>
          prevConfetti.filter((piece) => piece.id !== id)
        );
      }, 3000);
    }, 100);

    return () => clearInterval(interval);
  }, [confetti]);

  return (
    <div className="confetti-container">
      {confetti.map(({ id, emoji, top, left }) => (
        <span key={id} className="confetti-emoji" style={{ top, left }}>
          {emoji}
        </span>
      ))}
    </div>
  );
}
