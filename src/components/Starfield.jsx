import React, { useEffect, useRef } from 'react';

const Starfield = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let stars = [];
    let animationFrameId;
    let lastTime = 0;
    let viewport = { width: 0, height: 0, dpr: 1 };

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const saveData = navigator.connection?.saveData;
    const isSmallScreen = window.innerWidth < 640;
    const isLowPower = prefersReducedMotion || saveData;
    const targetFps = isLowPower ? 0 : (isSmallScreen ? 24 : 40);
    const numStars = isLowPower ? (isSmallScreen ? 60 : 90) : (isSmallScreen ? 140 : 250);

    const resizeCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, isLowPower ? 1 : 1.5);
      viewport = { width: window.innerWidth, height: window.innerHeight, dpr };
      canvas.width = Math.floor(viewport.width * dpr);
      canvas.height = Math.floor(viewport.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const createStars = () => {
      stars = [];
      for (let i = 0; i < numStars; i++) {
        stars.push({
          x: Math.random() * viewport.width,
          y: Math.random() * viewport.height,
          size: Math.random() * 1.5 + 0.5,
          speed: Math.random() * 0.4 + 0.1,
          opacity: Math.random() * 0.5 + 0.5
        });
      }
    };

    const drawFrame = () => {
      ctx.clearRect(0, 0, viewport.width, viewport.height);

      stars.forEach((star) => {
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
        ctx.fillRect(star.x, star.y, star.size, star.size);

        if (targetFps > 0) {
          star.y += star.speed;
          if (star.y > viewport.height) {
            star.y = 0;
            star.x = Math.random() * viewport.width;
          }
        }
      });
    };

    const animate = (time) => {
      if (targetFps === 0) return;
      if (!lastTime || time - lastTime >= 1000 / targetFps) {
        lastTime = time;
        drawFrame();
      }
      animationFrameId = requestAnimationFrame(animate);
    };

    resizeCanvas();
    createStars();
    drawFrame();
    animationFrameId = requestAnimationFrame(animate);

    const handleResize = () => {
      resizeCanvas();
      createStars();
      drawFrame();
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
        zIndex: -1,
        background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)'
      }} 
    />
  );
};

export default Starfield;
