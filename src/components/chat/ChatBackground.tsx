
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

      // Random position and gentle rotation
      mainShape.position.x = (Math.random() - 0.5) * 12;
      mainShape.position.y = (Math.random() - 0.5) * 12;
      mainShape.position.z = (Math.random() - 0.5) * 8;
      mainShape.rotation.x = Math.random() * Math.PI * 0.15;
      mainShape.rotation.y = Math.random() * Math.PI * 0.15;

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

    // Smoother animation
    let time = 0;
    function animate() {
      requestAnimationFrame(animate);
      time += 0.003;

      shapes.forEach((shape, index) => {
        // Smooth floating animation
        shape.position.y += Math.sin(time + index * 0.5) * 0.003;
        shape.rotation.x += 0.0005;
        shape.rotation.y += 0.0008;
        
        // Subtle wobble
        shape.rotation.z = Math.sin(time + index * 0.5) * 0.05;
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
