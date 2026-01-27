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
    let animationFrameId;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const createStars = () => {
      const count = 220;
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

    const spawnShootingStar = () => {
      const startX = Math.random() * canvas.width;
      const startY = Math.random() * canvas.height * 0.4;
      shootingStars.push({
        x: startX,
        y: startY,
        vx: 6 + Math.random() * 6,
        vy: 3 + Math.random() * 4,
        life: 0,
        maxLife: 40 + Math.random() * 30
      });
    };

    const spawnSupernova = () => {
      supernovas.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height * 0.7,
        radius: 0,
        maxRadius: 120 + Math.random() * 180,
        life: 0,
        maxLife: 120 + Math.random() * 120
      });
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

      if (Math.random() < 0.03 && shootingStars.length < 6) {
        spawnShootingStar();
      }
      if (Math.random() < 0.01 && supernovas.length < 3) {
        spawnSupernova();
      }

      shootingStars.forEach((star, idx) => {
        const alpha = 1 - star.life / star.maxLife;
        ctx.strokeStyle = `rgba(255, 220, 160, ${alpha})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(star.x, star.y);
        ctx.lineTo(star.x - star.vx * 2.5, star.y - star.vy * 2.5);
        ctx.stroke();
        star.x += star.vx;
        star.y += star.vy;
        star.life += 1;
        if (star.life >= star.maxLife || star.x > canvas.width + 80 || star.y > canvas.height + 80) {
          shootingStars.splice(idx, 1);
        }
      });

      supernovas.forEach((nova, idx) => {
        const lifeRatio = nova.life / nova.maxLife;
        nova.radius = nova.maxRadius * lifeRatio;
        const intensity = 1 - lifeRatio;
        const grad = ctx.createRadialGradient(nova.x, nova.y, 0, nova.x, nova.y, nova.radius);
        grad.addColorStop(0, `rgba(255, 240, 200, ${0.55 * intensity})`);
        grad.addColorStop(0.4, `rgba(255, 170, 90, ${0.35 * intensity})`);
        grad.addColorStop(1, 'rgba(255, 100, 20, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(nova.x, nova.y, nova.radius, 0, Math.PI * 2);
        ctx.fill();
        nova.life += 1;
        if (nova.life >= nova.maxLife) {
          supernovas.splice(idx, 1);
        }
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
