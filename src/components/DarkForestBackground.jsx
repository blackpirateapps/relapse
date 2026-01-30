import React from 'react';

const DarkForestBackground = () => {
  return (
    <>
      <div className="dark-forest-bg">
        <div className="dark-forest-fog fog-a" />
        <div className="dark-forest-fog fog-b" />
        <div className="dark-forest-fog fog-c" />
      </div>
      <style jsx global>{`
        .dark-forest-bg {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: -1;
          --background-start: #050b0b;
          --background-mid: #0b1b1a;
          --background-end: #020606;
          background-color: var(--background-start);
          background-image:
            radial-gradient(circle at 20% 10%, rgba(40, 80, 70, 0.35), transparent 45%),
            radial-gradient(circle at 80% 20%, rgba(30, 60, 50, 0.35), transparent 50%),
            url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><path d="M60 120 L60 0" stroke="rgba(255,255,255,0.05)" stroke-width="1"/></svg>'),
            url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="90" height="120"><path d="M45 120 L45 0" stroke="rgba(255,255,255,0.08)" stroke-width="2"/></svg>'),
            url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="70" height="120"><path d="M35 120 L35 0" stroke="rgba(255,255,255,0.12)" stroke-width="3"/></svg>'),
            linear-gradient(to bottom, var(--background-start), var(--background-mid), var(--background-end));
          background-repeat: no-repeat, no-repeat, repeat, repeat, repeat, no-repeat;
          background-position: 0 0, 0 0, 0 0, 0 0, 0 0, 0 0;
          background-size: 120% 120%, 140% 140%, 240px 120%, 180px 120%, 120px 120%, 100% 100%;
          animation: darkForestDrift 70s linear infinite;
        }

        .dark-forest-fog {
          position: absolute;
          left: -20%;
          width: 140%;
          height: 45%;
          filter: blur(25px);
          opacity: 0.35;
          background: radial-gradient(circle, rgba(120, 190, 160, 0.2), rgba(20, 40, 35, 0));
          animation: fogDrift 28s ease-in-out infinite;
        }

        .fog-a { top: 10%; animation-duration: 34s; }
        .fog-b { top: 40%; animation-duration: 26s; opacity: 0.3; }
        .fog-c { top: 65%; animation-duration: 30s; opacity: 0.25; }

        @keyframes darkForestDrift {
          from { background-position: 0 0, 0 0, 0% 0, 0% 0, 0% 0, 0 0; }
          to { background-position: 0 0, 0 0, -480px 0, -520px 0, -580px 0, 0 0; }
        }

        @keyframes fogDrift {
          0% { transform: translateX(0) translateY(0); }
          50% { transform: translateX(8%) translateY(-3%); }
          100% { transform: translateX(0) translateY(0); }
        }

        @media (max-width: 640px) {
          .dark-forest-bg { animation: none; }
          .fog-b, .fog-c { display: none; }
        }

        @media (prefers-reduced-motion: reduce) {
          .dark-forest-bg { animation: none; }
          .dark-forest-fog { animation: none; }
        }
      `}</style>
    </>
  );
};

export default DarkForestBackground;
