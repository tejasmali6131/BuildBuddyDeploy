import React, { useRef, useEffect } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls, Environment } from '@react-three/drei';
import * as THREE from 'three';

// 3D Bungalow Model Component
function BungalowMesh() {
  const meshRef = useRef();
  // Temporarily disable GLTF loading to fix deployment issues
  // const gltf = useLoader(GLTFLoader, '/models/old_suburban_bungalow.glb');

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.3; // Smooth rotation
    }
  });

  return (
    // Temporary simple house shape while GLTF loading is disabled
    <group ref={meshRef} position={[0, 0, 0]} scale={[1, 1, 1]}>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[2, 1.5, 2]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>
      <mesh position={[0, 1.2, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[1.5, 0.8, 4]} />
        <meshStandardMaterial color="#654321" />
      </mesh>
    </group>
  );
}

// Particle System for AI Generation Effect
function Particles() {
  const particlesRef = useRef();
  const count = 30;

  useFrame((state, delta) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y += delta * 0.1;
    }
  });

  const positions = React.useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 6;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 4;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 6;
    }
    return positions;
  }, []);

  return (
    <points ref={particlesRef}>
      <bufferGeometry attach="geometry">
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        attach="material"
        size={0.03}
        color="#6366f1"
        transparent
        opacity={0.4}
      />
    </points>
  );
}

// Main 3D Scene Component
export default function BungalowModel() {
  return (
    <div style={{ width: '100%', height: '100%' }}>
      <Canvas
        camera={{ position: [9, 6, 9], fov: 55 }}
        style={{ background: 'transparent' }}
        onCreated={({ gl }) => {
          gl.setClearColor('#000000', 0);
        }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight 
          position={[5, 5, 5]} 
          intensity={0.8} 
          castShadow 
          shadow-mapSize={[1024, 1024]}
        />
        <pointLight position={[-3, 3, -3]} intensity={0.3} color="#6366f1" />
        <pointLight position={[3, -3, 3]} intensity={0.3} color="#06d6a0" />

        {/* 3D Models */}
        <BungalowMesh />
        <Particles />

        {/* Environment and Controls */}
        <Environment preset="night" />
        
        {/* Disable controls for auto-rotation, but keep for future use */}
        {/* <OrbitControls enableZoom={false} enablePan={false} /> */}
      </Canvas>
    </div>
  );
}