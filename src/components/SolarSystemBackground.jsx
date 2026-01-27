import React, { useEffect, useRef } from 'react';

const SolarSystemBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let time = 0;

    const planets = [
      { name: 'Mercury', radius: 4, orbit: 60, speed: 0.02, color: '#c7b59b' },
      { name: 'Venus', radius: 6, orbit: 90, speed: 0.015, color: '#e0c18a' },
      { name: 'Earth', radius: 7, orbit: 130, speed: 0.012, color: '#3b82f6' },
      { name: 'Mars', radius: 5, orbit: 170, speed: 0.01, color: '#ef4444' },
      { name: 'Jupiter', radius: 12, orbit: 230, speed: 0.007, color: '#f59e0b' },
      { name: 'Saturn', radius: 10, orbit: 290, speed: 0.006, color: '#facc15', ring: true },
      { name: 'Uranus', radius: 8, orbit: 350, speed: 0.005, color: '#22d3ee' },
      { name: 'Neptune', radius: 8, orbit: 410, speed: 0.004, color: '#6366f1' }
    ];

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const draw = () => {
      const { width, height } = canvas;
      const cx = width * 0.5;
      const cy = height * 0.5;

      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = '#06060f';
      ctx.fillRect(0, 0, width, height);

      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(width, height) * 0.6);
      glow.addColorStop(0, 'rgba(255, 180, 80, 0.25)');
      glow.addColorStop(0.6, 'rgba(80, 60, 140, 0.12)');
      glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);

      // Sun
      const sunRadius = 22;
      const sunGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, sunRadius * 4);
      sunGlow.addColorStop(0, 'rgba(255, 220, 130, 0.9)');
      sunGlow.addColorStop(0.4, 'rgba(255, 180, 80, 0.5)');
      sunGlow.addColorStop(1, 'rgba(255, 120, 40, 0)');
      ctx.fillStyle = sunGlow;
      ctx.beginPath();
      ctx.arc(cx, cy, sunRadius * 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffd17a';
      ctx.beginPath();
      ctx.arc(cx, cy, sunRadius, 0, Math.PI * 2);
      ctx.fill();

      planets.forEach((planet, idx) => {
        const angle = time * planet.speed + idx;
        const x = cx + Math.cos(angle) * planet.orbit;
        const y = cy + Math.sin(angle) * planet.orbit * 0.6;

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(cx, cy, planet.orbit, planet.orbit * 0.6, 0, 0, Math.PI * 2);
        ctx.stroke();

        if (planet.ring) {
          ctx.strokeStyle = 'rgba(255, 230, 170, 0.5)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.ellipse(x, y, planet.radius * 1.8, planet.radius * 0.6, 0.3, 0, Math.PI * 2);
          ctx.stroke();
        }

        ctx.fillStyle = planet.color;
        ctx.beginPath();
        ctx.arc(x, y, planet.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      time += 0.02;
      animationFrameId = requestAnimationFrame(draw);
    };

    resizeCanvas();
    draw();

    const handleResize = () => {
      resizeCanvas();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1
      }}
    />
  );
};

export default SolarSystemBackground;
