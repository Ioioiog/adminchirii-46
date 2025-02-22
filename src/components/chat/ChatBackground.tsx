
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
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true 
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    containerRef.current.appendChild(renderer.domElement);

    // Create message-like objects
    const messages: THREE.Mesh[] = [];
    const messageCount = 15;

    // Create gradient texture for messages
    const canvas = document.createElement('canvas');
    canvas.width = 512; // Increased resolution
    canvas.height = 512;
    const context = canvas.getContext('2d');
    if (context) {
      // Create a more sophisticated gradient
      const gradient = context.createLinearGradient(0, 0, 512, 512);
      gradient.addColorStop(0, '#1D4ED8'); // blue-700
      gradient.addColorStop(0.5, '#2563EB'); // blue-600
      gradient.addColorStop(1, '#1E40AF'); // darker blue-700

      // Add some noise/texture
      context.fillStyle = gradient;
      context.fillRect(0, 0, 512, 512);

      // Add subtle pattern
      context.globalAlpha = 0.05;
      for (let i = 0; i < 100; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        context.fillStyle = '#ffffff';
        context.fillRect(x, y, 2, 2);
      }
    }
    const messageTexture = new THREE.CanvasTexture(canvas);
    messageTexture.needsUpdate = true;

    // Create message objects with more realistic shapes
    for (let i = 0; i < messageCount; i++) {
      const width = Math.random() * 2 + 1.5; // Slightly larger
      const height = Math.random() * 0.8 + 0.6;
      const roundedRectShape = new THREE.Shape();
      const radius = 0.3; // Increased corner radius
      
      // Create rounded rectangle with smooth corners
      roundedRectShape.moveTo(-width/2 + radius, -height/2);
      roundedRectShape.lineTo(width/2 - radius, -height/2);
      roundedRectShape.quadraticCurveTo(width/2, -height/2, width/2, -height/2 + radius);
      roundedRectShape.lineTo(width/2, height/2 - radius);
      roundedRectShape.quadraticCurveTo(width/2, height/2, width/2 - radius, height/2);
      roundedRectShape.lineTo(-width/2 + radius, height/2);
      roundedRectShape.quadraticCurveTo(-width/2, height/2, -width/2, height/2 - radius);
      roundedRectShape.lineTo(-width/2, -height/2 + radius);
      roundedRectShape.quadraticCurveTo(-width/2, -height/2, -width/2 + radius, -height/2);

      const geometry = new THREE.ExtrudeGeometry(roundedRectShape, {
        depth: 0.05, // Add depth for 3D effect
        bevelEnabled: true,
        bevelThickness: 0.02,
        bevelSize: 0.02,
        bevelSegments: 3
      });

      // Create more sophisticated material
      const material = new THREE.MeshPhysicalMaterial({
        map: messageTexture,
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide,
        metalness: 0.2,
        roughness: 0.3,
        clearcoat: 0.3,
        clearcoatRoughness: 0.2,
        envMapIntensity: 1,
        transmission: 0.05,
      });

      const message = new THREE.Mesh(geometry, material);
      
      // Random position and rotation with better distribution
      message.position.x = (Math.random() - 0.5) * 12;
      message.position.y = (Math.random() - 0.5) * 12;
      message.position.z = (Math.random() - 0.5) * 8;
      message.rotation.x = Math.random() * Math.PI * 0.25;
      message.rotation.y = Math.random() * Math.PI * 0.25;
      
      // Enable shadows
      message.castShadow = true;
      message.receiveShadow = true;
      
      messages.push(message);
      scene.add(message);
    }

    // Enhanced lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    scene.add(directionalLight);

    // Add a soft point light for extra dimension
    const pointLight = new THREE.PointLight(0x3b82f6, 0.5);
    pointLight.position.set(-5, 5, 3);
    scene.add(pointLight);

    camera.position.z = 10;

    // Smoother animation
    let time = 0;
    function animate() {
      requestAnimationFrame(animate);
      time += 0.003; // Slower animation

      messages.forEach((message, index) => {
        // Smooth floating animation
        message.position.y += Math.sin(time + index * 0.5) * 0.003;
        message.rotation.x += 0.0005;
        message.rotation.y += 0.0008;
        
        // Subtle wobble
        message.rotation.z = Math.sin(time + index * 0.5) * 0.05;
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
