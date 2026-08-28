import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';

function Node3D({ position, color, label, size = 0.4 }) {
  const meshRef = useRef();
  const [showLabel, setShowLabel] = useState(false);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.01;
      meshRef.current.rotation.y += 0.01;
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={position}
      onPointerOver={() => setShowLabel(true)}
      onPointerOut={() => setShowLabel(false)}
    >
      <sphereGeometry args={[size, 32, 32]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
      {showLabel && (
        <Html position={[0, size + 0.5, 0]}>
          <div style={{
            background: 'rgba(0,0,0,0.95)',
            color: 'white',
            padding: '10px 15px',
            borderRadius: '8px',
            fontSize: '12px',
            whiteSpace: 'nowrap',
            border: `2px solid ${color}`,
            boxShadow: `0 0 20px ${color}`
          }}>
            {label}
          </div>
        </Html>
      )}
    </mesh>
  );
}

function Edge3D({ start, end, color = '#00ff88' }) {
  const points = [
    new THREE.Vector3(start[0], start[1], start[2]),
    new THREE.Vector3(end[0], end[1], end[2])
  ];
  
  const curve = new THREE.CatmullRomCurve3(points);

  return (
    <mesh>
      <tubeGeometry args={[curve, 64, 0.02, 8, false]} />
      <meshBasicMaterial color={color} />
    </mesh>
  );
}

function Graph3D({ nodes, edges }) {
  const [autoRotate, setAutoRotate] = useState(true);

  const nodePositions = {};
  nodes.forEach((node, i) => {
    const angle = (i / Math.max(nodes.length, 1)) * Math.PI * 2;
    const radius = 3;
    nodePositions[node.id] = [
      Math.cos(angle) * radius,
      i % 2 === 0 ? 0.8 : -0.8,
      Math.sin(angle) * radius
    ];
  });

  const getColor = (node) => {
    const label = node.data?.label || '';
    if (label.includes('SUSPECT')) return '#ff0044';
    if (label.includes('VASP')) return '#00ff88';
    if (label.includes('Intermediary')) return '#ffa500';
    return '#78909c';
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas camera={{ position: [0, 0, 10], fov: 60 }}>
        <ambientLight intensity={0.6} />
        <pointLight position={[10, 10, 10]} intensity={1.5} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />
        
        <OrbitControls 
          autoRotate={autoRotate}
          autoRotateSpeed={1.5}
          enableZoom={true}
          enablePan={true}
        />
        
        {edges.map((edge) => {
          const start = nodePositions[edge.source] || [0, 0, 0];
          const end = nodePositions[edge.target] || [0, 0, 0];
          return (
            <Edge3D 
              key={edge.id} 
              start={start} 
              end={end} 
              color="#00ff88"
            />
          );
        })}
        
        {nodes.map((node) => {
          const position = nodePositions[node.id] || [0, 0, 0];
          const color = getColor(node);
          const label = node.data?.label || 'Unknown';
          const size = color === '#ff0044' ? 0.6 : 0.4;
          
          return (
            <Node3D
              key={node.id}
              position={position}
              color={color}
              label={label}
              size={size}
            />
          );
        })}
      </Canvas>
      
      <button
        onClick={() => setAutoRotate(!autoRotate)}
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          padding: '10px 20px',
          background: 'rgba(0,0,0,0.8)',
          color: 'white',
          border: '1px solid #00ff88',
          borderRadius: '8px',
          cursor: 'pointer',
          zIndex: 10,
          fontSize: '13px',
          fontWeight: 'bold'
        }}
      >
        {autoRotate ? '⏸ STOP ROTATION' : '▶ START ROTATION'}
      </button>
    </div>
  );
}

export default Graph3D;