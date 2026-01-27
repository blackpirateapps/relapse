import React, { useEffect, useRef } from 'react';

const PHOENIX_POINTS = [
  { x: 0.5, y: 0.2 },
  { x: 0.42, y: 0.28 },
  { x: 0.58, y: 0.28 },
  { x: 0.3, y: 0.4 },
  { x: 0.7, y: 0.4 },
  { x: 0.22, y: 0.52 },
  { x: 0.78, y: 0.52 },
  { x: 0.35, y: 0.6 },
  { x: 0.65, y: 0.6 },
  { x: 0.5, y: 0.7 },
  { x: 0.4, y: 0.78 },
  { x: 0.6, y: 0.78 }
];

const PHOENIX_EDGES = [
  [0, 1], [0, 2], [1, 3], [2, 4],
  [3, 5], [4, 6], [5, 7], [6, 8],
  [7, 9], [8, 9], [9, 10], [9, 11]
];

const PhoenixConstellationBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let stars = [];
    let animationFrameId;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const createStars = () => {
      const count = 200;
      stars = [];
      for (let i = 0; i < count; i++) {
        stars.push({
          x: Math.random(),
          y: Math.random(),
          radius: Math.random() * 1.6 + 0.4,
          twinkle: Math.random() * Math.PI * 2,
          speed: 0.004 + Math.random() * 0.01
        });
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#090712';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const gradient = ctx.createRadialGradient(
        canvas.width * 0.5,
        canvas.height * 0.2,
        canvas.width * 0.1,
        canvas.width * 0.5,
        canvas.height * 0.2,
        canvas.width * 0.6
      );
      gradient.addColorStop(0, 'rgba(120, 80, 255, 0.25)');
      gradient.addColorStop(0.5, 'rgba(50, 20, 120, 0.2)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      stars.forEach((star) => {
        const opacity = 0.4 + Math.sin(star.twinkle) * 0.3;
        ctx.fillStyle = `rgba(255, 220, 170, ${opacity})`;
        ctx.beginPath();
        ctx.arc(star.x * canvas.width, star.y * canvas.height, star.radius, 0, Math.PI * 2);
        ctx.fill();
        star.twinkle += star.speed;
      });

      const constellationPoints = PHOENIX_POINTS.map((point, idx) => ({
        x: point.x * canvas.width,
        y: point.y * canvas.height + Math.sin(Date.now() / 900 + idx) * 2
      }));

      ctx.strokeStyle = 'rgba(255, 170, 80, 0.35)';
      ctx.lineWidth = 1.5;
      PHOENIX_EDGES.forEach(([from, to]) => {
        ctx.beginPath();
        ctx.moveTo(constellationPoints[from].x, constellationPoints[from].y);
        ctx.lineTo(constellationPoints[to].x, constellationPoints[to].y);
        ctx.stroke();
      });

      constellationPoints.forEach((point, idx) => {
        const pulse = 0.5 + Math.sin(Date.now() / 700 + idx) * 0.4;
        ctx.fillStyle = `rgba(255, 210, 120, ${0.6 + pulse * 0.4})`;
        ctx.beginPath();
        ctx.arc(point.x, point.y, 2.5 + pulse * 1.2, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    resizeCanvas();
    createStars();
    draw();

    const handleResize = () => {
      resizeCanvas();
      createStars();
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

export default PhoenixConstellationBackground;
