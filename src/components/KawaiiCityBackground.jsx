import React from 'react';

function KawaiiCityBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(86,110,160,0.45),rgba(26,32,64,0.9),rgba(10,12,22,1))]" />
      <div className="absolute inset-x-0 bottom-0 h-2/5 bg-[linear-gradient(to_top,rgba(10,12,20,0.98),rgba(30,34,70,0.7),rgba(120,140,190,0))]" />

      <div className="absolute inset-0 opacity-70">
        <div className="kawaii-cloud cloud-one" />
        <div className="kawaii-cloud cloud-two" />
        <div className="kawaii-cloud cloud-three" />
        <div className="kawaii-cloud cloud-dark cloud-four" />
        <div className="kawaii-cloud cloud-dark cloud-five" />
      </div>

      <div className="absolute inset-x-0 bottom-0 h-1/2 flex items-end justify-center">
        <div className="kawaii-city" />
      </div>

      <div className="absolute inset-x-0 bottom-24 h-32">
        <div className="kawaii-tree-line" />
      </div>

      <div className="absolute inset-0 pointer-events-none">
        <span className="kawaii-heart heart-a" />
        <span className="kawaii-heart heart-b" />
        <span className="kawaii-heart heart-c" />
        <span className="kawaii-sparkle sparkle-a" />
        <span className="kawaii-sparkle sparkle-b" />
        <span className="kawaii-sparkle sparkle-c" />
        <span className="kawaii-petal petal-a" />
        <span className="kawaii-petal petal-b" />
        <span className="kawaii-petal petal-c" />
        <span className="kawaii-petal petal-d" />
        <span className="kawaii-petal petal-e" />
        <span className="kawaii-rain rain-a" />
        <span className="kawaii-rain rain-b" />
        <span className="kawaii-rain rain-c" />
        <span className="kawaii-rain rain-d" />
        <span className="kawaii-rain rain-e" />
        <span className="kawaii-rain rain-f" />
        <span className="kawaii-rain rain-g" />
        <span className="kawaii-rain rain-h" />
        <span className="kawaii-rain rain-i" />
        <span className="kawaii-rain rain-j" />
        <span className="kawaii-rain rain-k" />
        <span className="kawaii-rain rain-l" />
        <span className="kawaii-rain rain-m" />
        <span className="kawaii-rain rain-n" />
        <span className="kawaii-rain rain-o" />
        <span className="kawaii-lightning lightning-a" />
        <span className="kawaii-lightning lightning-b" />
        <span className="kawaii-firecracker firecracker-a" />
        <span className="kawaii-firecracker firecracker-b" />
        <span className="kawaii-firecracker firecracker-c" />
      </div>

      <style jsx>{`
        .kawaii-cloud {
          position: absolute;
          width: 220px;
          height: 70px;
          border-radius: 999px;
          background: rgba(200, 210, 240, 0.35);
          filter: blur(0.5px);
          box-shadow:
            30px 20px 0 -10px rgba(200, 210, 240, 0.4),
            -40px 20px 0 -15px rgba(160, 170, 210, 0.35);
          animation: drift 40s linear infinite;
        }
        .cloud-one { top: 10%; left: -10%; animation-delay: -6s; }
        .cloud-two { top: 22%; left: -20%; width: 280px; animation-duration: 46s; }
        .cloud-three { top: 34%; left: -15%; width: 200px; animation-duration: 36s; }
        .cloud-dark {
          background: rgba(80, 90, 130, 0.4);
          box-shadow:
            30px 20px 0 -10px rgba(60, 70, 110, 0.35),
            -40px 20px 0 -15px rgba(50, 60, 90, 0.35);
        }
        .cloud-four { top: 16%; left: -30%; width: 300px; animation-duration: 50s; }
        .cloud-five { top: 28%; left: -25%; width: 260px; animation-duration: 44s; animation-delay: -10s; }

        .kawaii-city {
          width: 120%;
          height: 100%;
          background:
            linear-gradient(to top, rgba(16, 18, 36, 0.98), rgba(30, 34, 80, 0.85)),
            repeating-linear-gradient(
              90deg,
              rgba(160, 180, 255, 0.25) 0px,
              rgba(160, 180, 255, 0.25) 6px,
              rgba(14, 16, 26, 0.55) 6px,
              rgba(14, 16, 26, 0.55) 14px
            );
          clip-path: polygon(0 40%, 6% 30%, 12% 42%, 18% 26%, 24% 38%, 30% 22%, 36% 36%, 44% 18%, 52% 32%, 60% 14%, 68% 34%, 76% 20%, 84% 38%, 92% 24%, 100% 42%, 100% 100%, 0 100%);
          animation: pulseCity 8s ease-in-out infinite;
        }

        .kawaii-tree-line {
          width: 120%;
          height: 100%;
          background: linear-gradient(to top, rgba(5, 7, 12, 0.9), rgba(10, 14, 24, 0.5));
          clip-path: polygon(
            0 75%, 6% 68%, 10% 72%, 16% 62%, 22% 70%, 28% 60%, 34% 68%, 40% 58%, 46% 66%,
            52% 58%, 58% 70%, 64% 62%, 70% 72%, 76% 60%, 82% 70%, 88% 62%, 94% 72%, 100% 66%,
            100% 100%, 0 100%
          );
          filter: blur(0.3px);
          opacity: 0.8;
        }

        .kawaii-heart {
          position: absolute;
          width: 22px;
          height: 22px;
          background: #b06ad9;
          transform: rotate(45deg);
          animation: floatUp 14s ease-in-out infinite;
          box-shadow: 0 0 10px rgba(176, 106, 217, 0.6);
        }
        .kawaii-heart::before,
        .kawaii-heart::after {
          content: '';
          position: absolute;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #b06ad9;
        }
        .kawaii-heart::before { top: -11px; left: 0; }
        .kawaii-heart::after { left: -11px; top: 0; }

        .heart-a { left: 18%; bottom: 15%; animation-delay: -2s; }
        .heart-b { left: 68%; bottom: 20%; animation-delay: -8s; background: #7fb1ff; }
        .heart-b::before, .heart-b::after { background: #7fb1ff; }
        .heart-c { left: 42%; bottom: 10%; animation-delay: -5s; background: #ff9ac8; }
        .heart-c::before, .heart-c::after { background: #ff9ac8; }

        .kawaii-sparkle {
          position: absolute;
          width: 10px;
          height: 10px;
          background: #d4e4ff;
          border-radius: 2px;
          transform: rotate(45deg);
          animation: twinkle 4s ease-in-out infinite;
          box-shadow: 0 0 8px rgba(180, 200, 255, 0.7);
        }
        .sparkle-a { top: 18%; left: 60%; animation-delay: -1s; }
        .sparkle-b { top: 30%; left: 30%; animation-delay: -2s; }
        .sparkle-c { top: 12%; left: 45%; animation-delay: -0.5s; }

        .kawaii-petal {
          position: absolute;
          width: 14px;
          height: 18px;
          background: linear-gradient(160deg, #ffc5e6, #b18cff);
          border-radius: 70% 70% 70% 70%;
          opacity: 0.8;
          animation: fallPetal 14s ease-in-out infinite;
        }
        .petal-a { top: -5%; left: 20%; animation-delay: -2s; }
        .petal-b { top: -8%; left: 50%; animation-delay: -6s; transform: rotate(20deg); }
        .petal-c { top: -10%; left: 70%; animation-delay: -9s; transform: rotate(-10deg); }
        .petal-d { top: -6%; left: 35%; animation-delay: -4s; transform: rotate(10deg); }
        .petal-e { top: -12%; left: 85%; animation-delay: -11s; transform: rotate(30deg); }

        .kawaii-rain {
          position: absolute;
          width: 2px;
          height: 120px;
          background: linear-gradient(to bottom, rgba(120, 160, 255, 0), rgba(120, 160, 255, 0.6));
          animation: rainFall 1.4s linear infinite;
        }
        .rain-a { left: 12%; top: -30%; animation-delay: -0.2s; }
        .rain-b { left: 18%; top: -40%; animation-delay: -0.6s; }
        .rain-c { left: 24%; top: -25%; animation-delay: -1.1s; }
        .rain-d { left: 32%; top: -35%; animation-delay: -0.4s; }
        .rain-e { left: 40%; top: -45%; animation-delay: -0.9s; }
        .rain-f { left: 48%; top: -28%; animation-delay: -0.7s; }
        .rain-g { left: 56%; top: -38%; animation-delay: -1.3s; }
        .rain-h { left: 64%; top: -22%; animation-delay: -0.8s; }
        .rain-i { left: 72%; top: -34%; animation-delay: -1.1s; }
        .rain-j { left: 80%; top: -40%; animation-delay: -0.5s; }
        .rain-k { left: 86%; top: -26%; animation-delay: -1.4s; }
        .rain-l { left: 90%; top: -32%; animation-delay: -0.9s; }
        .rain-m { left: 6%; top: -20%; animation-delay: -1.2s; }
        .rain-n { left: 52%; top: -20%; animation-delay: -0.3s; }
        .rain-o { left: 96%; top: -24%; animation-delay: -1.5s; }

        .kawaii-lightning {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 60% 18%, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0));
          opacity: 0;
          animation: lightningFlash 9s ease-in-out infinite;
          mix-blend-mode: screen;
        }
        .lightning-a { animation-delay: -2s; }
        .lightning-b { animation-delay: -6s; background: radial-gradient(circle at 30% 12%, rgba(180, 210, 255, 0.8), rgba(255, 255, 255, 0)); }

        .kawaii-firecracker {
          position: absolute;
          width: 60px;
          height: 60px;
          border-radius: 999px;
          border: 2px solid rgba(255, 170, 220, 0.8);
          box-shadow:
            0 0 12px rgba(255, 170, 220, 0.8),
            0 0 28px rgba(140, 200, 255, 0.6);
          opacity: 0;
          animation: firecrackerPop 18s ease-in-out infinite;
        }
        .firecracker-a { top: 18%; left: 22%; animation-delay: -3s; }
        .firecracker-b { top: 12%; left: 62%; animation-delay: -9s; border-color: rgba(140, 200, 255, 0.8); }
        .firecracker-c { top: 24%; left: 42%; animation-delay: -14s; border-color: rgba(255, 200, 140, 0.8); }

        @keyframes drift {
          0% { transform: translateX(0); opacity: 0; }
          10% { opacity: 1; }
          50% { opacity: 0.9; }
          100% { transform: translateX(120vw); opacity: 0; }
        }
        @keyframes pulseCity {
          0%, 100% { filter: brightness(1); }
          50% { filter: brightness(1.05); }
        }
        @keyframes floatUp {
          0% { transform: translateY(0) rotate(45deg); opacity: 0; }
          20% { opacity: 0.9; }
          80% { opacity: 0.7; }
          100% { transform: translateY(-120px) rotate(45deg); opacity: 0; }
        }
        @keyframes twinkle {
          0%, 100% { transform: scale(0.6) rotate(45deg); opacity: 0.4; }
          50% { transform: scale(1) rotate(45deg); opacity: 1; }
        }
        @keyframes fallPetal {
          0% { transform: translateY(0) translateX(0) rotate(0deg); opacity: 0; }
          20% { opacity: 0.8; }
          100% { transform: translateY(120vh) translateX(-60px) rotate(120deg); opacity: 0; }
        }
        @keyframes rainFall {
          0% { transform: translateY(0); opacity: 0; }
          10% { opacity: 0.6; }
          100% { transform: translateY(120vh); opacity: 0; }
        }
        @keyframes lightningFlash {
          0% { opacity: 0; }
          2% { opacity: 0.9; }
          4% { opacity: 0.1; }
          6% { opacity: 0.7; }
          8% { opacity: 0; }
          100% { opacity: 0; }
        }
        @keyframes firecrackerPop {
          0%, 88% { opacity: 0; transform: scale(0.2); }
          90% { opacity: 1; transform: scale(1); }
          94% { opacity: 0.2; transform: scale(1.4); }
          100% { opacity: 0; transform: scale(0.2); }
        }
      `}</style>
    </div>
  );
}

export default KawaiiCityBackground;
