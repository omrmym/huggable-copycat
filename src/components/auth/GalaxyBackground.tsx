import { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  size: number;
  color: string;
  speed: number;
  angle: number;
  twinkleSpeed: number;
  twinkleOffset: number;
}

export function GalaxyBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const starsRef = useRef<Star[]>([]);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initStars();
    };

    const colors = [
      'rgba(180,200,255,', // blue-white
      'rgba(255,220,150,', // warm
      'rgba(150,220,255,', // cyan
      'rgba(255,180,180,', // red
      'rgba(200,170,255,', // purple
      'rgba(170,240,220,', // teal
    ];

    const initStars = () => {
      const count = Math.min(200, Math.floor((canvas.width * canvas.height) / 5000));
      starsRef.current = Array.from({ length: count }, (_, i) => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        baseX: Math.random() * canvas.width,
        baseY: Math.random() * canvas.height,
        size: Math.random() * 2.5 + 0.5,
        color: colors[i % colors.length],
        speed: Math.random() * 0.3 + 0.05,
        angle: Math.random() * Math.PI * 2,
        twinkleSpeed: Math.random() * 2 + 1,
        twinkleOffset: Math.random() * Math.PI * 2,
      }));
    };

    const CONNECTION_DIST = 130;
    const MOUSE_RADIUS = 200;
    const MOUSE_PUSH = 60;

    const draw = (time: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const stars = starsRef.current;
      const mx = mouseRef.current.x * canvas.width;
      const my = mouseRef.current.y * canvas.height;
      const t = time * 0.001;

      // Update star positions
      for (const star of stars) {
        star.angle += star.speed * 0.01;
        const driftX = Math.cos(star.angle) * 15;
        const driftY = Math.sin(star.angle * 0.7) * 15;

        // Mouse attraction/repulsion
        const dx = mx - star.baseX;
        const dy = my - star.baseY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        let pushX = 0, pushY = 0;
        if (dist < MOUSE_RADIUS && dist > 0) {
          const force = (1 - dist / MOUSE_RADIUS) * MOUSE_PUSH;
          pushX = (dx / dist) * force;
          pushY = (dy / dist) * force;
        }

        star.x += (star.baseX + driftX + pushX - star.x) * 0.05;
        star.y += (star.baseY + driftY + pushY - star.y) * 0.05;
      }

      // Draw connections
      for (let i = 0; i < stars.length; i++) {
        for (let j = i + 1; j < stars.length; j++) {
          const dx = stars[i].x - stars[j].x;
          const dy = stars[i].y - stars[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONNECTION_DIST) {
            const alpha = (1 - dist / CONNECTION_DIST) * 0.25;
            ctx.beginPath();
            ctx.strokeStyle = `rgba(150,180,255,${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(stars[i].x, stars[i].y);
            ctx.lineTo(stars[j].x, stars[j].y);
            ctx.stroke();
          }
        }

        // Draw mouse connections
        const dxm = mx - stars[i].x;
        const dym = my - stars[i].y;
        const distM = Math.sqrt(dxm * dxm + dym * dym);
        if (distM < MOUSE_RADIUS) {
          const alpha = (1 - distM / MOUSE_RADIUS) * 0.4;
          ctx.beginPath();
          ctx.strokeStyle = `rgba(100,180,255,${alpha})`;
          ctx.lineWidth = 0.8;
          ctx.moveTo(stars[i].x, stars[i].y);
          ctx.lineTo(mx, my);
          ctx.stroke();
        }
      }

      // Draw stars
      for (const star of stars) {
        const twinkle = 0.5 + 0.5 * Math.sin(t * star.twinkleSpeed + star.twinkleOffset);
        const alpha = 0.3 + twinkle * 0.7;
        const glowSize = star.size * (1 + twinkle * 0.5);

        // Glow
        if (star.size > 1.5) {
          ctx.beginPath();
          ctx.arc(star.x, star.y, glowSize * 3, 0, Math.PI * 2);
          ctx.fillStyle = `${star.color}${alpha * 0.1})`;
          ctx.fill();
        }

        // Star core
        ctx.beginPath();
        ctx.arc(star.x, star.y, glowSize, 0, Math.PI * 2);
        ctx.fillStyle = `${star.color}${alpha})`;
        ctx.fill();
      }

      animRef.current = requestAnimationFrame(draw);
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = {
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      };
    };

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', handleMouseMove);
    animRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animRef.current);
    };
  }, []);

  return (
    <div className="fixed inset-0 -z-10">
      <div className="absolute inset-0 bg-[hsl(240,30%,3%)]" />
      {/* Nebula clouds behind canvas */}
      <div className="absolute w-[800px] h-[500px] rounded-full blur-[100px] animate-[nebula1_30s_ease-in-out_infinite]"
        style={{ background: 'radial-gradient(ellipse, hsl(280,80%,30%,0.15) 0%, transparent 80%)', left: '10%', top: '5%' }} />
      <div className="absolute w-[600px] h-[700px] rounded-full blur-[120px] animate-[nebula2_35s_ease-in-out_infinite]"
        style={{ background: 'radial-gradient(ellipse, hsl(210,90%,35%,0.12) 0%, transparent 80%)', right: '5%', bottom: '10%' }} />
      <div className="absolute w-[500px] h-[400px] rounded-full blur-[90px] animate-[nebula3_25s_ease-in-out_infinite]"
        style={{ background: 'radial-gradient(ellipse, hsl(190,80%,30%,0.1) 0%, transparent 80%)', left: '50%', top: '60%' }} />
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      <style>{`
        @keyframes nebula1 {
          0%, 100% { transform: translate(0, 0) rotate(0deg) scale(1); }
          33% { transform: translate(40px, -30px) rotate(3deg) scale(1.05); }
          66% { transform: translate(-20px, 20px) rotate(-2deg) scale(0.97); }
        }
        @keyframes nebula2 {
          0%, 100% { transform: translate(0, 0) rotate(0deg) scale(1); }
          33% { transform: translate(-50px, 30px) rotate(-4deg) scale(1.08); }
          66% { transform: translate(30px, -40px) rotate(2deg) scale(0.95); }
        }
        @keyframes nebula3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(30px, -20px) scale(1.1); }
        }
      `}</style>
    </div>
  );
}
