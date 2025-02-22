
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

    // Create shapes array
    const shapes: THREE.Mesh[] = [];
    const shapeCount = 12;

    // Function to create curved path for phone shape
    function createPhoneShape() {
      const shape = new THREE.Shape();
      shape.moveTo(0, 0);
      shape.bezierCurveTo(0.5, 0, 1, 0.5, 1, 1);
      shape.bezierCurveTo(1, 1.5, 0.5, 2, 0, 2);
      shape.bezierCurveTo(-0.5, 2, -1, 1.5, -1, 1);
      shape.bezierCurveTo(-1, 0.5, -0.5, 0, 0, 0);
      return shape;
    }

    // Function to create speech bubble shape
    function createBubbleShape() {
      const shape = new THREE.Shape();
      // Main bubble
      shape.moveTo(0, 0);
      shape.bezierCurveTo(1.5, 0, 2, 0.5, 2, 1);
      shape.bezierCurveTo(2, 1.5, 1.5, 2, 0, 2);
      shape.bezierCurveTo(-1.5, 2, -2, 1.5, -2, 1);
      shape.bezierCurveTo(-2, 0.5, -1.5, 0, 0, 0);
      // Add tail
      shape.moveTo(-0.5, 0);
      shape.quadraticCurveTo(-0.8, -0.5, -1, -1);
      return shape;
    }

    // Create different shape variations
    const shapeTypes = [createPhoneShape(), createBubbleShape()];

    for (let i = 0; i < shapeCount; i++) {
      const shapeType = shapeTypes[Math.floor(Math.random() * shapeTypes.length)];
      const scale = Math.random() * 0.5 + 0.5;

      const geometry = new THREE.ExtrudeGeometry(shapeType, {
        depth: 0.1,
        bevelEnabled: true,
        bevelThickness: 0.05,
        bevelSize: 0.05,
        bevelSegments: 4
      });

      // Create main shape with darker blue
      const mainMaterial = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color('#1D4ED8'), // blue-700
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide,
        metalness: 0.1,
        roughness: 0.2,
        clearcoat: 0.4,
        clearcoatRoughness: 0.2,
      });

      // Create overlay with lighter blue
      const overlayMaterial = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color('#93C5FD'), // blue-300
        transparent: true,
        opacity: 0.4,
        side: THREE.DoubleSide,
        metalness: 0.1,
        roughness: 0.2,
        clearcoat: 0.4,
        clearcoatRoughness: 0.2,
      });

      const mainShape = new THREE.Mesh(geometry, mainMaterial);
      mainShape.scale.set(scale, scale, scale);

      // Create and position overlay
      const overlayShape = new THREE.Mesh(geometry, overlayMaterial);
      overlayShape.scale.set(scale, scale, scale);
      overlayShape.position.set(0.15, -0.15, 0.02);
      mainShape.add(overlayShape);

      // Random position with wider spread
      mainShape.position.x = (Math.random() - 0.5) * 15; // Increased spread
      mainShape.position.y = (Math.random() - 0.5) * 15;
      mainShape.position.z = (Math.random() - 0.5) * 10;
      mainShape.rotation.x = Math.random() * Math.PI * 0.25; // Increased initial rotation
      mainShape.rotation.y = Math.random() * Math.PI * 0.25;

      // Store initial position for animation
      mainShape.userData.initialY = mainShape.position.y;
      mainShape.userData.speed = Math.random() * 0.5 + 0.5; // Random speed multiplier
      mainShape.userData.rotationSpeed = (Math.random() * 0.002) + 0.001; // Random rotation speed

      // Enable shadows
      mainShape.castShadow = true;
      mainShape.receiveShadow = true;
      overlayShape.castShadow = true;

      shapes.push(mainShape);
      scene.add(mainShape);
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

    // Enhanced animation with faster and more varied movements
    let time = 0;
    function animate() {
      requestAnimationFrame(animate);
      time += 0.008; // Increased base animation speed

      shapes.forEach((shape, index) => {
        const speed = shape.userData.speed;
        const rotationSpeed = shape.userData.rotationSpeed;
        
        // More dynamic floating animation
        shape.position.y = shape.userData.initialY + 
          Math.sin(time * speed + index) * 0.8; // Increased amplitude
        
        // Faster rotation with varying speeds
        shape.rotation.x += rotationSpeed * 2;
        shape.rotation.y += rotationSpeed * 3;
        
        // Dynamic wobble effect
        shape.rotation.z = Math.sin(time * speed + index) * 0.15; // Increased wobble

        // Add slight horizontal movement
        shape.position.x += Math.sin(time * speed * 0.5 + index) * 0.01;
        
        // Reset position if moved too far
        if (Math.abs(shape.position.x) > 15) {
          shape.position.x = Math.sign(shape.position.x) * 15;
        }
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
