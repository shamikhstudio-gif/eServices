'use client';

import React, { useEffect, useRef } from 'react';

interface Point {
  x: number;
  y: number;
  originX: number;
  originY: number;
  vx: number;
  vy: number;
  radius: number;
  baseRadius: number;
  alpha: number;
  baseAlpha: number;
  hoverRatio: number;
}

export default function InteractivePoints() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Sweet-spot hover interaction zone: 105px (Bigger a little bit, perfectly balanced)
    let mouse = {
      x: -1000,
      y: -1000,
      radius: 105,
      isActive: false,
    };

    // Generate grid points (All Pure White)
    const spacing = 36;
    let points: Point[] = [];

    function initPoints() {
      points = [];
      const cols = Math.ceil(width / spacing) + 2;
      const rows = Math.ceil(height / spacing) + 2;
      const offsetX = (width - (cols - 1) * spacing) / 2;
      const offsetY = (height - (rows - 1) * spacing) / 2;

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = offsetX + i * spacing;
          const y = offsetY + j * spacing;

          points.push({
            x,
            y,
            originX: x,
            originY: y,
            vx: 0,
            vy: 0,
            radius: 1.3,
            baseRadius: 1.3,
            alpha: 0.18,
            baseAlpha: 0.18,
            hoverRatio: 0,
          });
        }
      }
    }

    initPoints();

    // Resize handler
    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initPoints();
    };

    window.addEventListener('resize', handleResize);

    // Mouse handlers
    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.isActive = true;
    };

    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
      mouse.isActive = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    // Damped, silky spring physics
    const friction = 0.91;
    const spring = 0.028;
    let time = 0;

    // Render loop
    const render = () => {
      time += 0.011;
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < points.length; i++) {
        const p = points[i];

        // Delicate, harmonic breathing wave
        const idleWave = Math.sin(time + p.originX * 0.011 + p.originY * 0.011) * 0.9;

        // Distance to mouse
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < mouse.radius && mouse.isActive) {
          const normDist = dist / mouse.radius;
          const force = 1 - normDist;
          const angle = Math.atan2(dy, dx);

          // Smooth, balanced displacement (A little bit bigger)
          p.vx -= Math.cos(angle) * force * 1.2;
          p.vy -= Math.sin(angle) * force * 1.2;

          // Balanced expansion
          p.radius = p.baseRadius + force * 1.2;
          p.alpha = Math.min(0.75, p.baseAlpha + force * 0.50);
          p.hoverRatio = Math.min(1, p.hoverRatio + force * 0.28);
        } else {
          // Soft fluid return
          p.radius += (p.baseRadius - p.radius) * 0.06;
          p.alpha += (p.baseAlpha - p.alpha) * 0.05;
          p.hoverRatio += (0 - p.hoverRatio) * 0.05;
        }

        // Spring pulling back to grid
        const targetX = p.originX;
        const targetY = p.originY + idleWave;
        const springX = (targetX - p.x) * spring;
        const springY = (targetY - p.y) * spring;

        p.vx = (p.vx + springX) * friction;
        p.vy = (p.vy + springY) * friction;

        p.x += p.vx;
        p.y += p.vy;

        // Render point: Crisp, balanced white glow
        if (p.hoverRatio > 0.02) {
          const glowRadius = Math.max(1.8, p.radius * 2.3);
          const radGrad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowRadius);

          radGrad.addColorStop(0, `rgba(255, 255, 255, ${p.alpha})`);
          radGrad.addColorStop(0.4, `rgba(255, 255, 255, ${p.alpha * p.hoverRatio * 0.65})`);
          radGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

          ctx.beginPath();
          ctx.arc(p.x, p.y, glowRadius, 0, Math.PI * 2);
          ctx.fillStyle = radGrad;
          ctx.fill();
        } else {
          // Idle point
          ctx.beginPath();
          ctx.arc(p.x, p.y, Math.max(0.4, p.radius), 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`;
          ctx.fill();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <>
      {/* Interactive Points Canvas (Desktop Only via CSS) */}
      <canvas
        ref={canvasRef}
        className="interactive-points-canvas"
        style={{
          position: 'fixed',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      {/* Cinematic Corner Vignette (Desktop Only via CSS) */}
      <div
        className="points-vignette-overlay"
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 2,
          background: `
            radial-gradient(ellipse at 50% 50%, transparent 35%, rgba(5, 5, 8, 0.45) 60%, #000000 95%),
            linear-gradient(to right, #000000 0%, transparent 15%, transparent 85%, #000000 100%),
            linear-gradient(to bottom, #000000 0%, transparent 12%, transparent 88%, #000000 100%)
          `,
        }}
      />

      {/* Dedicated Phone Mobile Ambient Background Mesh */}
      <div className="phone-bg-mesh" />
    </>
  );
}
