
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

    // Function to create enhanced phone shape with more details
    function createPhoneShape() {
      const shape = new THREE.Shape();
      // More detailed curved path for phone shape
      shape.moveTo(0, 0);
      shape.bezierCurveTo(1, 0, 1.5, 0.8, 1.5, 1.5);
      shape.bezierCurveTo(1.5, 2.2, 1, 3, 0, 3);
      shape.bezierCurveTo(-1, 3, -1.5, 2.2, -1.5, 1.5);
      shape.bezierCurveTo(-1.5, 0.8, -1, 0, 0, 0);
      
      // Add inner details (screen)
      const hole = new THREE.Path();
      hole.moveTo(-0.8, 0.5);
      hole.bezierCurveTo(-0.8, 0.5, 0.8, 0.5, 0.8, 0.5);
      hole.bezierCurveTo(0.8, 2, -0.8, 2, -0.8, 0.5);
      shape.holes.push(hole);
      
      return shape;
    }

    // Function to create enhanced speech bubble shape
    function createBubbleShape() {
      const shape = new THREE.Shape();
      // More dynamic bubble with enhanced curves
      shape.moveTo(0, 0);
      shape.bezierCurveTo(2.5, 0, 3, 1, 3, 2);
      shape.bezierCurveTo(3, 3, 2.5, 3.5, 0, 3.5);
      shape.bezierCurveTo(-2.5, 3.5, -3, 3, -3, 2);
      shape.bezierCurveTo(-3, 1, -2.5, 0, 0, 0);
      
      // Enhanced tail with more natural curve
      shape.moveTo(-0.8, 0);
      shape.quadraticCurveTo(-1.5, -1, -2, -2);
      shape.quadraticCurveTo(-2.2, -2.5, -1.8, -2.2);
      
      return shape;
    }

    // Create different shape variations
    const shapeTypes = [createPhoneShape(), createBubbleShape()];

    for (let i = 0; i < shapeCount; i++) {
      const shapeType = shapeTypes[Math.floor(Math.random() * shapeTypes.length)];
      const scale = Math.random() * 0.5 + 0.5;

      const geometry = new THREE.ExtrudeGeometry(shapeType, {
        depth: 0.2, // Increased depth
        bevelEnabled: true,
        bevelThickness: 0.08, // Enhanced bevel
        bevelSize: 0.08,
        bevelSegments: 6, // More segments for smoother edges
        curveSegments: 12 // More segments for smoother curves
      });

      // Create main shape with blue-600
      const mainMaterial = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color('#2563EB'),
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide,
        metalness: 0.2, // Enhanced metalness
        roughness: 0.1, // Reduced roughness for more shine
        clearcoat: 0.8, // Enhanced clearcoat
        clearcoatRoughness: 0.1,
        envMapIntensity: 1.5 // Enhanced environment map intensity
      });

      // Create overlay with new sky blue color
      const overlayMaterial = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color('#87c0fa'),
        transparent: true,
        opacity: 0.4,
        side: THREE.DoubleSide,
        metalness: 0.2,
        roughness: 0.1,
        clearcoat: 0.8,
        clearcoatRoughness: 0.1,
        envMapIntensity: 1.5
      });

      const mainShape = new THREE.Mesh(geometry, mainMaterial);
      mainShape.scale.set(scale, scale, scale);

      // Create and position overlay with enhanced offset
      const overlayShape = new THREE.Mesh(geometry, overlayMaterial);
      overlayShape.scale.set(scale, scale, scale);
      overlayShape.position.set(0.2, -0.2, 0.03); // Enhanced offset
      mainShape.add(overlayShape);

      // Random position with wider spread
      mainShape.position.x = (Math.random() - 0.5) * 15;
      mainShape.position.y = (Math.random() - 0.5) * 15;
      mainShape.position.z = (Math.random() - 0.5) * 10;
      mainShape.rotation.x = Math.random() * Math.PI * 0.25;
      mainShape.rotation.y = Math.random() * Math.PI * 0.25;

      // Store initial position for animation
      mainShape.userData.initialY = mainShape.position.y;
      mainShape.userData.speed = Math.random() * 0.5 + 0.5;
      mainShape.userData.rotationSpeed = (Math.random() * 0.002) + 0.001;

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

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2); // Enhanced intensity
    directionalLight.position.set(5, 5, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048; // Enhanced shadow resolution
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // Add multiple point lights for better depth
    const pointLight1 = new THREE.PointLight(0x3b82f6, 0.6);
    pointLight1.position.set(-5, 5, 3);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x3b82f6, 0.4);
    pointLight2.position.set(5, -5, 3);
    scene.add(pointLight2);

    camera.position.z = 10;

    // Enhanced animation with more dynamic movements
    let time = 0;
    function animate() {
      requestAnimationFrame(animate);
      time += 0.008;

      shapes.forEach((shape, index) => {
        const speed = shape.userData.speed;
        const rotationSpeed = shape.userData.rotationSpeed;
        
        // Enhanced floating motion
        shape.position.y = shape.userData.initialY + 
          Math.sin(time * speed + index) * 1.2;
        
        // Enhanced rotation
        shape.rotation.x += rotationSpeed * 2.5;
        shape.rotation.y += rotationSpeed * 3.5;
        
        // Add subtle z-axis movement
        shape.position.z += Math.sin(time * speed * 0.3) * 0.01;
        
        shape.rotation.z = Math.sin(time * speed + index) * 0.2;

        shape.position.x += Math.sin(time * speed * 0.5 + index) * 0.01;
        
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
