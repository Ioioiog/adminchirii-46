
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export function ChatBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    containerRef.current.appendChild(renderer.domElement);

    // Create animated emoji-like particles
    const geometry = new THREE.BufferGeometry();
    const particles = 50;
    const positions = new Float32Array(particles * 3);
    const colors = new Float32Array(particles * 3);
    const sizes = new Float32Array(particles);

    // Blue color palette
    const blueColors = [
      [0.11, 0.68, 0.85], // #1EAEDB
      [0.2, 0.76, 0.94],  // #33C3F0
      [0.06, 0.63, 0.81], // #0FA0CE
    ];

    for (let i = 0; i < particles * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 15;
      positions[i + 1] = (Math.random() - 0.5) * 15;
      positions[i + 2] = (Math.random() - 0.5) * 15;

      const colorIndex = Math.floor(Math.random() * blueColors.length);
      colors[i] = blueColors[colorIndex][0];
      colors[i + 1] = blueColors[colorIndex][1];
      colors[i + 2] = blueColors[colorIndex][2];

      sizes[i / 3] = Math.random() * 0.5 + 0.2; // Varying sizes for depth effect
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    // Custom shader material for emoji-like particles
    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
      },
      vertexShader: `
        attribute float size;
        varying vec3 vColor;
        uniform float time;
        void main() {
          vColor = color;
          vec3 pos = position;
          // Add bouncing animation
          pos.y += sin(time + position.x) * 0.3;
          pos.x += cos(time + position.y) * 0.3;
          // Add "breathing" effect
          float scale = 1.0 + sin(time * 2.0) * 0.1;
          
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z) * scale;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        void main() {
          vec2 uv = gl_PointCoord * 2.0 - 1.0;
          float r = length(uv);
          
          // Basic emoji face shape
          if (r > 1.0) discard;
          
          // Eyes
          vec2 leftEye = vec2(-0.3, 0.2);
          vec2 rightEye = vec2(0.3, 0.2);
          float eyes = smoothstep(0.1, 0.05, length(uv - leftEye)) +
                      smoothstep(0.1, 0.05, length(uv - rightEye));
          
          // Smile
          float smile = smoothstep(0.5, 0.45, length(vec2(uv.x, uv.y + 0.2) * vec2(1.0, 0.5)));
          smile *= step(0.0, uv.y + 0.2);
          
          // Combine face elements
          vec3 color = vColor;
          color = mix(color, vec3(0.0), eyes + smile);
          
          gl_FragColor = vec4(color, 1.0);
        }
      `,
      transparent: true,
      vertexColors: true,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    camera.position.z = 10;

    // Animation
    let time = 0;
    function animate() {
      requestAnimationFrame(animate);
      time += 0.005;
      material.uniforms.time.value = time;
      points.rotation.y += 0.001;
      points.rotation.x += 0.0005;
      renderer.render(scene, camera);
    }

    // Handle resize
    function handleResize() {
      if (!containerRef.current) return;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    window.addEventListener('resize', handleResize);
    animate();

    return () => {
      if (containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}
