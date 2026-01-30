import React, { useEffect } from 'react';

function StarfieldWarpBackground() {
  useEffect(() => {
    const universe = document.getElementById('universe');
    if (!universe) return undefined;

    universe.innerHTML = '';
    const maxTime = 30;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const saveData = navigator.connection?.saveData;
    const isSmallScreen = window.innerWidth < 640;
    const isLowPower = prefersReducedMotion || saveData;
    const starCount = isLowPower ? (isSmallScreen ? 90 : 140) : (isSmallScreen ? 220 : 400);
    const width = window.innerWidth;
    const height = window.innerHeight;
    const animations = [];

    if (!isLowPower) {
      for (let i = 0; i < starCount; ++i) {
        const ypos = Math.round(Math.random() * height);
        const star = document.createElement('div');
        const speed = 1000 * (Math.random() * maxTime + 1);
        star.setAttribute('class', `star${3 - Math.floor(speed / 1000 / 8)}`);
        star.style.backgroundColor = 'white';

        universe.appendChild(star);
        const anim = star.animate(
          [
            { transform: `translate3d(${width}px, ${ypos}px, 0)` },
            { transform: `translate3d(-${Math.random() * 256}px, ${ypos}px, 0)` }
          ],
          {
            delay: Math.random() * -speed,
            duration: speed,
            iterations: 1000
          }
        );
        animations.push(anim);
      }
    }

    const elem = document.querySelector('.pulse');
    const pulseAnimation = !isLowPower && elem
      ? elem.animate(
          {
            opacity: [0.5, 1],
            transform: ['scale(0.5)', 'scale(1)']
          },
          {
            direction: 'alternate',
            duration: 500,
            iterations: Infinity
          }
        )
      : null;

    return () => {
      animations.forEach((anim) => anim.cancel());
      if (pulseAnimation) pulseAnimation.cancel();
      universe.innerHTML = '';
    };
  }, []);

  return (
    <>
      <div id="universe"></div>
      <div className="pulse" />
      <style jsx>{`
        body {
          background: #ffa17f;
          background: -webkit-linear-gradient(to right, #00223e, #ffa17f);
          background: linear-gradient(to right, #00223e, #ffa17f);
        }
        #universe {
          position: fixed;
          inset: 0;
          z-index: -1;
          overflow: hidden;
          pointer-events: none;
        }
        .pulse {
          position: fixed;
          inset: 0;
          z-index: -1;
          pointer-events: none;
        }

        .star0 {
          height: 1px;
          width: 1px;
          opacity: 1;
          position: absolute;
        }

        .star1 {
          height: 2px;
          width: 2px;
          border-radius: 50%;
          opacity: 1;
          position: absolute;
        }

        .star2 {
          height: 3px;
          width: 3px;
          border-radius: 50%;
          opacity: 1;
          position: absolute;
        }

        .star3 {
          height: 4px;
          width: 4px;
          border-radius: 50%;
          opacity: 1;
          position: absolute;
        }
      `}</style>
    </>
  );
}

export default StarfieldWarpBackground;
