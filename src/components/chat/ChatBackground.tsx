
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

    // Function to create typing dot shape
    function createTypingDot() {
      const shape = new THREE.Shape();
      const radius = 0.4;
      shape.arc(0, 0, radius, 0, Math.PI * 2, false);
      return shape;
    }

    // Function to create curved path for phone shape
    function createPhoneShape() {
      const shape = new THREE.Shape();
      shape.moveTo(0, 0);
      shape.bezierCurveTo(0.8, 0, 1.2, 0.6, 1.2, 1.2);
      shape.bezierCurveTo(1.2, 1.8, 0.8, 2.4, 0, 2.4);
      shape.bezierCurveTo(-0.8, 2.4, -1.2, 1.8, -1.2, 1.2);
      shape.bezierCurveTo(-1.2, 0.6, -0.8, 0, 0, 0);
      return shape;
    }

    // Function to create speech bubble shape
    function createBubbleShape() {
      const shape = new THREE.Shape();
      shape.moveTo(0, 0);
      shape.bezierCurveTo(2, 0, 2.5, 0.8, 2.5, 1.5);
      shape.bezierCurveTo(2.5, 2.2, 2, 2.8, 0, 2.8);
      shape.bezierCurveTo(-2, 2.8, -2.5, 2.2, -2.5, 1.5);
      shape.bezierCurveTo(-2.5, 0.8, -2, 0, 0, 0);
      shape.moveTo(-0.5, 0);
      shape.quadraticCurveTo(-1.2, -0.8, -1.5, -1.5);
      return shape;
    }

    // Create different shape variations
    const shapeTypes = [createPhoneShape(), createBubbleShape()];

    // Create typing dots
    const typingDots: THREE.Mesh[] = [];
    const dotsCount = 3;
    const dotSpacing = 1;

    for (let i = 0; i < dotsCount; i++) {
      const dotGeometry = new THREE.ExtrudeGeometry(createTypingDot(), {
        depth: 0.2,
        bevelEnabled: true,
        bevelThickness: 0.05,
        bevelSize: 0.05,
        bevelSegments: 4
      });

      const dotMaterial = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color('#2563EB'),
        transparent: true,
        opacity: 0.9,
        metalness: 0.1,
        roughness: 0.2,
        clearcoat: 0.4,
        clearcoatRoughness: 0.2,
      });

      const dot = new THREE.Mesh(dotGeometry, dotMaterial);
      dot.position.x = (i - 1) * dotSpacing;
      dot.position.y = 0;
      dot.position.z = 2;
      dot.userData.initialY = dot.position.y;
      dot.userData.delay = i * 0.2;

      typingDots.push(dot);
      scene.add(dot);
    }

    // Create regular shapes
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

      // Create main shape with blue-600
      const mainMaterial = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color('#2563EB'),
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide,
        metalness: 0.1,
        roughness: 0.2,
        clearcoat: 0.4,
        clearcoatRoughness: 0.2,
      });

      // Create overlay with new sky blue color
      const overlayMaterial = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color('#87c0fa'),
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
      mainShape.position.x = (Math.random() - 0.5) * 15;
      mainShape.position.y = (Math.random() - 0.5) * 15;
      mainShape.position.z = (Math.random() - 0.5) * 10;
      mainShape.rotation.x = Math.random() * Math.PI * 0.25;
      mainShape.rotation.y = Math.random() * Math.PI * 0.25;

      mainShape.userData.initialY = mainShape.position.y;
      mainShape.userData.speed = Math.random() * 0.5 + 0.5;
      mainShape.userData.rotationSpeed = (Math.random() * 0.002) + 0.001;

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

    const pointLight = new THREE.PointLight(0x3b82f6, 0.5);
    pointLight.position.set(-5, 5, 3);
    scene.add(pointLight);

    camera.position.z = 10;

    let time = 0;
    function animate() {
      requestAnimationFrame(animate);
      time += 0.008;

      // Animate typing dots
      typingDots.forEach((dot, index) => {
        const delay = dot.userData.delay;
        dot.position.y = Math.sin(time * 3 + delay) * 0.2;
        dot.rotation.z = Math.sin(time * 2 + delay) * 0.1;
      });

      // Animate shapes
      shapes.forEach((shape, index) => {
        const speed = shape.userData.speed;
        const rotationSpeed = shape.userData.rotationSpeed;
        
        shape.position.y = shape.userData.initialY + 
          Math.sin(time * speed + index) * 0.8;
        
        shape.rotation.x += rotationSpeed * 2;
        shape.rotation.y += rotationSpeed * 3;
        
        shape.rotation.z = Math.sin(time * speed + index) * 0.15;

        shape.position.x += Math.sin(time * speed * 0.5 + index) * 0.01;
        
        if (Math.abs(shape.position.x) > 15) {
          shape.position.x = Math.sign(shape.position.x) * 15;
        }
      });

      renderer.render(scene, camera);
    }

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
