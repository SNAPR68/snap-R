'use client';
import { useEffect, useRef } from 'react';

export function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = Math.max(document.documentElement.scrollHeight, window.innerHeight * 5);
    };

    resize();
    window.addEventListener('resize', resize);

    // Only 2 cameras - left and right
    const cameras = [
      {
        x: 80,
        y: 350,
        size: 70,
        speed: 0.3,
        delay: 0,
        flashTimer: 0,
        flashIntensity: 0,
      },
      {
        x: canvas.width - 80,
        y: 400,
        size: 70,
        speed: 0.25,
        delay: 1.5,
        flashTimer: 2,
        flashIntensity: 0,
      },
    ];

    const drawCamera = (x: number, y: number, size: number, flashIntensity: number) => {
      ctx.save();
      ctx.translate(x, y);

      // Camera body shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.fillRect(-size/2 + 3, -size/3 + 3, size, size * 0.6);

      // Camera body
      ctx.fillStyle = '#2a2a2a';
      ctx.fillRect(-size/2, -size/3, size, size * 0.6);
      
      // Body highlight
      ctx.fillStyle = '#3a3a3a';
      ctx.fillRect(-size/2, -size/3, size, size * 0.15);

      // Viewfinder
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(-size/5, -size/2, size/3, size/6);

      // Lens outer (gold ring)
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.28, 0, Math.PI * 2);
      ctx.fillStyle = '#D4A017';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.23, 0, Math.PI * 2);
      ctx.fillStyle = '#B8860B';
      ctx.fill();

      // Lens inner (dark)
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.18, 0, Math.PI * 2);
      ctx.fillStyle = '#111';
      ctx.fill();

      // Lens reflection
      ctx.beginPath();
      ctx.arc(-size * 0.05, -size * 0.05, size * 0.06, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.fill();

      // Flash unit - gold tinted
      ctx.fillStyle = 'rgba(212, 160, 23, 0.5)';
      ctx.fillRect(size/3, -size/3, size/6, size/5);

      // Subtle gold flash glow when active
      if (flashIntensity > 0.05) {
        const gradient = ctx.createRadialGradient(
          size/3 + size/12, -size/3 + size/10, 0,
          size/3 + size/12, -size/3 + size/10, size * 0.6
        );
        gradient.addColorStop(0, `rgba(212, 160, 23, ${flashIntensity * 0.4})`);
        gradient.addColorStop(0.5, `rgba(212, 160, 23, ${flashIntensity * 0.15})`);
        gradient.addColorStop(1, 'rgba(212, 160, 23, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(size/3 + size/12, -size/3 + size/10, size * 0.6, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update right camera X position on resize
      cameras[1].x = canvas.width - 80;

      // Draw cameras
      cameras.forEach((cam, i) => {
        // Smooth float animation - just up and down
        const floatY = Math.sin(time * cam.speed + cam.delay) * 25;

        // Flash timer - every 5 seconds, subtle
        cam.flashTimer += 0.016;
        if (cam.flashTimer > 5 + i * 2) {
          cam.flashTimer = 0;
          cam.flashIntensity = 0.8;
        }

        // Decay flash smoothly
        if (cam.flashIntensity > 0) {
          cam.flashIntensity *= 0.92;
          if (cam.flashIntensity < 0.03) cam.flashIntensity = 0;
        }

        drawCamera(cam.x, cam.y + floatY, cam.size, cam.flashIntensity);
      });

      time += 0.016;
      animationId = requestAnimationFrame(draw);
    };

    draw();

    const handleScroll = () => {
      const scrollY = window.scrollY;
      // Keep cameras in view as user scrolls
      cameras[0].y = 350 + scrollY * 0.1;
      cameras[1].y = 400 + scrollY * 0.1;
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 1 }}
    />
  );
}