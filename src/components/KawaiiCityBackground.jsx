import React from 'react';

function KawaiiCityBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,229,249,0.9),rgba(182,220,255,0.7),rgba(90,120,180,0.9))]" />
      <div className="absolute inset-x-0 bottom-0 h-2/5 bg-[linear-gradient(to_top,rgba(35,40,80,0.95),rgba(88,90,160,0.65),rgba(255,230,248,0))]" />

      <div className="absolute inset-0 opacity-70">
        <div className="kawaii-cloud cloud-one" />
        <div className="kawaii-cloud cloud-two" />
        <div className="kawaii-cloud cloud-three" />
      </div>

      <div className="absolute inset-x-0 bottom-0 h-1/2 flex items-end justify-center">
        <div className="kawaii-city" />
      </div>

      <div className="absolute inset-0 pointer-events-none">
        <span className="kawaii-heart heart-a" />
        <span className="kawaii-heart heart-b" />
        <span className="kawaii-heart heart-c" />
        <span className="kawaii-sparkle sparkle-a" />
        <span className="kawaii-sparkle sparkle-b" />
        <span className="kawaii-sparkle sparkle-c" />
      </div>

      <style jsx>{`
        .kawaii-cloud {
          position: absolute;
          width: 220px;
          height: 70px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.7);
          filter: blur(0.5px);
          box-shadow:
            30px 20px 0 -10px rgba(255, 255, 255, 0.75),
            -40px 20px 0 -15px rgba(255, 255, 255, 0.6);
          animation: drift 28s linear infinite;
        }
        .cloud-one { top: 12%; left: -10%; animation-delay: -4s; }
        .cloud-two { top: 25%; left: -20%; width: 280px; animation-duration: 34s; }
        .cloud-three { top: 38%; left: -15%; width: 200px; animation-duration: 24s; }

        .kawaii-city {
          width: 120%;
          height: 100%;
          background:
            linear-gradient(to top, rgba(30, 24, 60, 0.95), rgba(45, 48, 120, 0.8)),
            repeating-linear-gradient(
              90deg,
              rgba(255, 208, 250, 0.35) 0px,
              rgba(255, 208, 250, 0.35) 6px,
              rgba(20, 20, 40, 0.4) 6px,
              rgba(20, 20, 40, 0.4) 14px
            );
          clip-path: polygon(0 40%, 6% 30%, 12% 42%, 18% 26%, 24% 38%, 30% 22%, 36% 36%, 44% 18%, 52% 32%, 60% 14%, 68% 34%, 76% 20%, 84% 38%, 92% 24%, 100% 42%, 100% 100%, 0 100%);
          animation: pulseCity 6s ease-in-out infinite;
        }

        .kawaii-heart {
          position: absolute;
          width: 22px;
          height: 22px;
          background: #ff8fd8;
          transform: rotate(45deg);
          animation: floatUp 10s ease-in-out infinite;
          box-shadow: 0 0 12px rgba(255, 120, 220, 0.8);
        }
        .kawaii-heart::before,
        .kawaii-heart::after {
          content: '';
          position: absolute;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #ff8fd8;
        }
        .kawaii-heart::before { top: -11px; left: 0; }
        .kawaii-heart::after { left: -11px; top: 0; }

        .heart-a { left: 18%; bottom: 15%; animation-delay: -2s; }
        .heart-b { left: 68%; bottom: 20%; animation-delay: -6s; background: #9ce1ff; }
        .heart-b::before, .heart-b::after { background: #9ce1ff; }
        .heart-c { left: 42%; bottom: 10%; animation-delay: -4s; background: #ffd07a; }
        .heart-c::before, .heart-c::after { background: #ffd07a; }

        .kawaii-sparkle {
          position: absolute;
          width: 10px;
          height: 10px;
          background: #fff0fb;
          border-radius: 2px;
          transform: rotate(45deg);
          animation: twinkle 3s ease-in-out infinite;
          box-shadow: 0 0 10px rgba(255, 255, 255, 0.8);
        }
        .sparkle-a { top: 18%; left: 60%; animation-delay: -1s; }
        .sparkle-b { top: 30%; left: 30%; animation-delay: -2s; }
        .sparkle-c { top: 12%; left: 45%; animation-delay: -0.5s; }

        @keyframes drift {
          0% { transform: translateX(0); opacity: 0; }
          10% { opacity: 1; }
          50% { opacity: 0.9; }
          100% { transform: translateX(120vw); opacity: 0; }
        }
        @keyframes pulseCity {
          0%, 100% { filter: brightness(1); }
          50% { filter: brightness(1.1); }
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
      `}</style>
    </div>
  );
}

export default KawaiiCityBackground;
