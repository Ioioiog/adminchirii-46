
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export function ChatBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup with white background
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    containerRef.current.appendChild(renderer.domElement);

    // Create message-like objects
    const messages: THREE.Mesh[] = [];
    const messageCount = 15;

    // Create gradient texture for messages
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const context = canvas.getContext('2d');
    if (context) {
      const gradient = context.createLinearGradient(0, 0, 256, 256);
      gradient.addColorStop(0, '#60A5FA'); // blue-400
      gradient.addColorStop(1, '#3B82F6'); // blue-500
      context.fillStyle = gradient;
      context.fillRect(0, 0, 256, 256);
    }
    const messageTexture = new THREE.CanvasTexture(canvas);

    // Create message objects with rounded corners
    for (let i = 0; i < messageCount; i++) {
      const width = Math.random() * 2 + 1;
      const height = Math.random() * 0.8 + 0.4;
      const roundedRectShape = new THREE.Shape();
      const radius = 0.2;
      
      roundedRectShape.moveTo(-width/2 + radius, -height/2);
      roundedRectShape.lineTo(width/2 - radius, -height/2);
      roundedRectShape.quadraticCurveTo(width/2, -height/2, width/2, -height/2 + radius);
      roundedRectShape.lineTo(width/2, height/2 - radius);
      roundedRectShape.quadraticCurveTo(width/2, height/2, width/2 - radius, height/2);
      roundedRectShape.lineTo(-width/2 + radius, height/2);
      roundedRectShape.quadraticCurveTo(-width/2, height/2, -width/2, height/2 - radius);
      roundedRectShape.lineTo(-width/2, -height/2 + radius);
      roundedRectShape.quadraticCurveTo(-width/2, -height/2, -width/2 + radius, -height/2);

      const geometry = new THREE.ShapeGeometry(roundedRectShape);
      const material = new THREE.MeshPhongMaterial({
        map: messageTexture,
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide,
      });

      const message = new THREE.Mesh(geometry, material);
      
      // Random position and rotation
      message.position.x = (Math.random() - 0.5) * 15;
      message.position.y = (Math.random() - 0.5) * 15;
      message.position.z = (Math.random() - 0.5) * 10;
      message.rotation.x = Math.random() * Math.PI;
      message.rotation.y = Math.random() * Math.PI;
      
      messages.push(message);
      scene.add(message);
    }

    // Add ambient and directional light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    camera.position.z = 10;

    // Animation
    let time = 0;
    function animate() {
      requestAnimationFrame(animate);
      time += 0.005;

      messages.forEach((message, index) => {
        // Floating animation
        message.position.y += Math.sin(time + index) * 0.005;
        message.rotation.x += 0.001;
        message.rotation.y += 0.002;
        
        // Gentle wobble
        message.rotation.z = Math.sin(time + index * 0.5) * 0.1;
      });

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
      className="absolute inset-0 pointer-events-none bg-white"
      style={{ zIndex: 0 }}
    />
  );
}
