import { memo, useEffect, useState } from 'react';

interface LoadingDotsProps {
  text: string;
}

export const LoadingDots = memo(({ text }: LoadingDotsProps) => {
  const [dotCount, setDotCount] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setDotCount((prevDotCount) => (prevDotCount + 1) % 4);
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex justify-center items-center h-full">
      <div className="flex items-center gap-3 p-6 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl border border-bolt-elements-borderColor backdrop-blur-lg">
        <div className="flex space-x-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 animate-pulse transition-opacity duration-500 ${
                i < dotCount ? 'opacity-100' : 'opacity-30'
              }`}
              style={{
                animationDelay: `${i * 0.1}s`,
              }}
            />
          ))}
        </div>
        <span className="text-bolt-elements-textSecondary font-medium">{text}</span>
      </div>
    </div>
  );
});
