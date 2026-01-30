import React, { useEffect, useRef } from 'react';

const PhoenixConstellationBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let stars = [];
    let shootingStars = [];
    let supernovas = [];
    let asteroids = [];
    let globalFlash = 0;
    let animationFrameId;
    let lastTime = 0;
    let viewport = { width: 0, height: 0, dpr: 1 };

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const saveData = navigator.connection?.saveData;
    const isSmallScreen = window.innerWidth < 640;
    const isLowPower = prefersReducedMotion || saveData;
    const targetFps = isLowPower ? 0 : (isSmallScreen ? 24 : 40);

    const resizeCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, isLowPower ? 1 : 1.5);
      viewport = { width: window.innerWidth, height: window.innerHeight, dpr };
      canvas.width = Math.floor(viewport.width * dpr);
      canvas.height = Math.floor(viewport.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const createStars = () => {
      const count = isLowPower ? (isSmallScreen ? 80 : 120) : (isSmallScreen ? 160 : 220);
      stars = [];
      const starColors = [
        [255, 220, 170],
        [180, 220, 255],
        [255, 180, 220],
        [200, 255, 210],
        [255, 240, 200]
      ];
      for (let i = 0; i < count; i++) {
        const color = starColors[Math.floor(Math.random() * starColors.length)];
        stars.push({
          x: Math.random(),
          y: Math.random(),
          radius: Math.random() * 1.6 + 0.4,
          twinkle: Math.random() * Math.PI * 2,
          speed: 0.004 + Math.random() * 0.01,
          color
        });
      }
    };

    const createAsteroids = () => {
      const count = isLowPower ? (isSmallScreen ? 12 : 20) : (isSmallScreen ? 28 : 40);
      asteroids = [];
      for (let i = 0; i < count; i++) {
        asteroids.push({
          x: Math.random() * viewport.width,
          y: Math.random() * viewport.height,
          size: 6 + Math.random() * 18,
          speed: 2 + Math.random() * 6,
          drift: 0.6 + Math.random() * 1.8,
          opacity: 0.4 + Math.random() * 0.5
        });
      }
    };

    const spawnShootingStar = () => {
      const startX = Math.random() * viewport.width;
      const startY = Math.random() * viewport.height * 0.4;
      shootingStars.push({
        x: startX,
        y: startY,
        vx: 6 + Math.random() * 6,
        vy: 3 + Math.random() * 4,
        life: 0,
        maxLife: 40 + Math.random() * 30
      });
    };

    const spawnSupernova = (burst = false) => {
      if (burst) {
        const bursts = 6 + Math.floor(Math.random() * 6);
        for (let i = 0; i < bursts; i++) {
          supernovas.push({
            x: Math.random() * viewport.width,
            y: Math.random() * viewport.height * 0.8,
            radius: 0,
            maxRadius: 180 + Math.random() * 220,
            life: 0,
            maxLife: 80 + Math.random() * 80,
            hue: Math.random() * 360
          });
        }
        globalFlash = 1;
        return;
      }
      supernovas.push({
        x: Math.random() * viewport.width,
        y: Math.random() * viewport.height * 0.7,
        radius: 0,
        maxRadius: 120 + Math.random() * 180,
        life: 0,
        maxLife: 120 + Math.random() * 120,
        hue: 20 + Math.random() * 30
      });
    };

    const drawFrame = () => {
      ctx.clearRect(0, 0, viewport.width, viewport.height);
      ctx.fillStyle = '#090712';
      ctx.fillRect(0, 0, viewport.width, viewport.height);

      const gradient = ctx.createRadialGradient(
        viewport.width * 0.5,
        viewport.height * 0.2,
        viewport.width * 0.1,
        viewport.width * 0.5,
        viewport.height * 0.2,
        viewport.width * 0.6
      );
      gradient.addColorStop(0, 'rgba(120, 80, 255, 0.25)');
      gradient.addColorStop(0.5, 'rgba(50, 20, 120, 0.2)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, viewport.width, viewport.height);

      stars.forEach((star) => {
        const opacity = 0.35 + Math.sin(star.twinkle) * 0.35;
        ctx.fillStyle = `rgba(${star.color[0]}, ${star.color[1]}, ${star.color[2]}, ${opacity})`;
        ctx.beginPath();
        ctx.arc(star.x * viewport.width, star.y * viewport.height, star.radius, 0, Math.PI * 2);
        ctx.fill();
        if (targetFps > 0) {
          star.twinkle += star.speed;
        }
      });

      if (!isLowPower && Math.random() < 0.03 && shootingStars.length < 6) {
        spawnShootingStar();
      }
      if (!isLowPower && Math.random() < 0.007 && supernovas.length < 4) {
        spawnSupernova(false);
      }
      if (!isLowPower && Math.random() < 0.0015) {
        spawnSupernova(true);
      }

      asteroids.forEach((asteroid, idx) => {
        const tailX = asteroid.x - asteroid.speed * 3.5;
        const tailY = asteroid.y - asteroid.drift * 3.5;
        ctx.strokeStyle = `rgba(120, 140, 160, ${asteroid.opacity * 0.5})`;
        ctx.lineWidth = Math.max(1, asteroid.size / 10);
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(asteroid.x, asteroid.y);
        ctx.stroke();

        ctx.fillStyle = `rgba(150, 160, 170, ${asteroid.opacity})`;
        ctx.beginPath();
        ctx.ellipse(asteroid.x, asteroid.y, asteroid.size * 0.5, asteroid.size * 0.3, 0.3, 0, Math.PI * 2);
        ctx.fill();

        if (targetFps > 0) {
          asteroid.x += asteroid.speed;
          asteroid.y += asteroid.drift;
          if (asteroid.x > viewport.width + 60 || asteroid.y > viewport.height + 60) {
            asteroids[idx] = {
              x: -40 - Math.random() * viewport.width * 0.2,
              y: Math.random() * viewport.height * 0.3,
              size: 6 + Math.random() * 18,
              speed: 2 + Math.random() * 6,
              drift: 0.6 + Math.random() * 1.8,
              opacity: 0.4 + Math.random() * 0.5
            };
          }
        }
      });

      shootingStars.forEach((star, idx) => {
        const alpha = 1 - star.life / star.maxLife;
        ctx.strokeStyle = `rgba(255, 220, 160, ${alpha})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(star.x, star.y);
        ctx.lineTo(star.x - star.vx * 2.5, star.y - star.vy * 2.5);
        ctx.stroke();
        if (targetFps > 0) {
          star.x += star.vx;
          star.y += star.vy;
          star.life += 1;
          if (star.life >= star.maxLife || star.x > viewport.width + 80 || star.y > viewport.height + 80) {
            shootingStars.splice(idx, 1);
          }
        }
      });

      supernovas.forEach((nova, idx) => {
        const lifeRatio = nova.life / nova.maxLife;
        nova.radius = nova.maxRadius * lifeRatio;
        const intensity = 1 - lifeRatio;
        const grad = ctx.createRadialGradient(nova.x, nova.y, 0, nova.x, nova.y, nova.radius);
        grad.addColorStop(0, `hsla(${nova.hue}, 100%, 90%, ${0.65 * intensity})`);
        grad.addColorStop(0.4, `hsla(${nova.hue + 30}, 100%, 60%, ${0.45 * intensity})`);
        grad.addColorStop(1, `hsla(${nova.hue + 60}, 100%, 50%, 0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(nova.x, nova.y, nova.radius, 0, Math.PI * 2);
        ctx.fill();
        if (targetFps > 0) {
          nova.life += 1;
          if (nova.life >= nova.maxLife) {
            supernovas.splice(idx, 1);
          }
        }
      });

      if (globalFlash > 0) {
        ctx.fillStyle = `rgba(255, 200, 140, ${0.2 * globalFlash})`;
        ctx.fillRect(0, 0, viewport.width, viewport.height);
        if (targetFps > 0) {
          globalFlash = Math.max(0, globalFlash - 0.03);
        }
      }
    };

    resizeCanvas();
    createStars();
    createAsteroids();
    drawFrame();

    const animate = (time) => {
      if (targetFps === 0) return;
      if (!lastTime || time - lastTime >= 1000 / targetFps) {
        lastTime = time;
        drawFrame();
      }
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    const handleResize = () => {
      resizeCanvas();
      createStars();
      createAsteroids();
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
        zIndex: -1
      }}
    />
  );
};

export default PhoenixConstellationBackground;
