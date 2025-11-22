'use client';

import { useEffect, useRef } from 'react';

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  energy: number;
}

interface Connection {
  from: Node;
  to: Node;
  strength: number;
}

export function NeuralNetworkBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const nodesRef = useRef<Node[]>([]);
  const connectionsRef = useRef<Connection[]>([]);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const createNodes = () => {
      const nodes: Node[] = [];
      const nodeCount = Math.min(120, Math.floor((canvas.width * canvas.height) / 8000));
      
      for (let i = 0; i < nodeCount; i++) {
        nodes.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.2,
          vy: (Math.random() - 0.5) * 0.2,
          radius: Math.random() * 1.5 + 0.5,
          energy: Math.random()
        });
      }
      
      nodesRef.current = nodes;
    };

    const createConnections = () => {
      const connections: Connection[] = [];
      const nodes = nodesRef.current;
      
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const distance = Math.sqrt(
            Math.pow(nodes[i].x - nodes[j].x, 2) + 
            Math.pow(nodes[i].y - nodes[j].y, 2)
          );
          
          if (distance < 120) {
            connections.push({
              from: nodes[i],
              to: nodes[j],
              strength: 1 - (distance / 120)
            });
          }
        }
      }
      
      connectionsRef.current = connections;
    };

    const updateNodes = () => {
      const nodes = nodesRef.current;
      
      nodes.forEach(node => {
        // Actualizar posición con movimiento más suave
        node.x += node.vx;
        node.y += node.vy;
        
        // Rebote en bordes con suavidad
        if (node.x <= 0 || node.x >= canvas.width) {
          node.vx *= -0.8; // Pérdida de energía al rebotar
          node.x = Math.max(0, Math.min(canvas.width, node.x));
        }
        if (node.y <= 0 || node.y >= canvas.height) {
          node.vy *= -0.8;
          node.y = Math.max(0, Math.min(canvas.height, node.y));
        }
        
        // Actualizar energía más lento para estrellas
        node.energy += 0.008;
        if (node.energy > 1) node.energy = 0;
        
        // Atracción hacia el mouse más sutil
        const dx = mouseRef.current.x - node.x;
        const dy = mouseRef.current.y - node.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 150 && distance > 0) {
          const force = node.radius < 1.2 ? 0.0002 : 0.0004; // Menos fuerza para estrellas
          node.vx += (dx / distance) * force;
          node.vy += (dy / distance) * force;
        }
        
        // Aplicar fricción para movimiento más natural
        node.vx *= 0.995;
        node.vy *= 0.995;
        
        // Limitar velocidad
        const speed = Math.sqrt(node.vx * node.vx + node.vy * node.vy);
        const maxSpeed = node.radius < 1.2 ? 0.3 : 0.4; // Estrellas se mueven más lento
        if (speed > maxSpeed) {
          node.vx = (node.vx / speed) * maxSpeed;
          node.vy = (node.vy / speed) * maxSpeed;
        }
      });
    };

    const draw = () => {
      // Fondo con gradiente sutil
      const gradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2, canvas.width / 2
      );
      gradient.addColorStop(0, '#0F0F0F');
      gradient.addColorStop(1, '#000000');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Dibujar conexiones
      connectionsRef.current.forEach(connection => {
        const opacity = connection.strength * 0.12;
        const pulse = Math.sin(Date.now() * 0.001 + connection.from.x * 0.01) * 0.15 + 0.85;
        
        ctx.strokeStyle = `rgba(59, 130, 246, ${opacity * pulse})`;
        ctx.lineWidth = connection.strength * 0.6;
        
        ctx.beginPath();
        ctx.moveTo(connection.from.x, connection.from.y);
        ctx.lineTo(connection.to.x, connection.to.y);
        ctx.stroke();
      });
      
      // Dibujar nodos
      nodesRef.current.forEach(node => {
        const pulse = Math.sin(Date.now() * 0.003 + node.energy * Math.PI * 2) * 0.4 + 0.6;
        const opacity = pulse * 0.9;
        
        // Efecto de estrella para nodos pequeños
        if (node.radius < 1.2) {
          // Dibujar como estrella
          ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
          ctx.beginPath();
          for (let i = 0; i < 4; i++) {
            const angle = (i * Math.PI) / 2;
            const x = node.x + Math.cos(angle) * node.radius * 2;
            const y = node.y + Math.sin(angle) * node.radius * 2;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.fill();
        } else {
          // Nodo principal
          ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
          ctx.fill();
        }
        
        // Aura azul para todos los nodos
        ctx.fillStyle = `rgba(59, 130, 246, ${opacity * 0.25})`;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius * 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Brillo central
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity * 0.8})`;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius * 0.4, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    const animate = () => {
      updateNodes();
      draw();
      animationRef.current = requestAnimationFrame(animate);
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleResize = () => {
      resizeCanvas();
      createNodes();
      createConnections();
    };

    // Inicializar
    resizeCanvas();
    createNodes();
    createConnections();
    animate();

    // Event listeners
    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ background: 'transparent' }}
    />
  );
}