import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Box, Sphere, Torus, Plane } from '@react-three/drei';
import * as THREE from 'three';
import { CellValue, Position } from '../types/game';

interface Board3DProps {
  board: CellValue[][][];
  onCellClick: (position: Position) => void;
  winningLine: Position[] | null;
}

interface CellProps {
  position: Position;
  value: CellValue;
  onClick: () => void;
  isWinning: boolean;
}

const Cell: React.FC<CellProps> = ({ position, value, onClick, isWinning }) => {
  const [hovered, setHovered] = useState(false);
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current && isWinning) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 2;
    }
  });

  const { layer, row, col } = position;
  const x = (col - 1) * 2.2;
  const y = (layer - 1) * 2.2;
  const z = (row - 1) * 2.2;

  return (
    <group position={[x, y, z]}>
      <Plane
        args={[2, 2]}
        rotation={[-Math.PI / 2, 0, 0]}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onClick={onClick}
      >
        <meshStandardMaterial
          color={hovered ? '#e0e0e0' : '#d0d0d0'}
          metalness={0.1}
          roughness={0.8}
          transparent={true}
          opacity={0.3}
          side={THREE.DoubleSide}
        />
      </Plane>
      
      {value === 'X' && (
        <group ref={meshRef} position={[0, 0.3, 0]}>
          <Box args={[1.2, 0.3, 0.3]} rotation={[Math.PI / 2, 0, Math.PI / 4]}>
            <meshStandardMaterial color={isWinning ? '#FFD700' : '#FF6B6B'} emissive={isWinning ? '#FFD700' : '#FF6B6B'} emissiveIntensity={0.3} />
          </Box>
          <Box args={[1.2, 0.3, 0.3]} rotation={[Math.PI / 2, 0, -Math.PI / 4]}>
            <meshStandardMaterial color={isWinning ? '#FFD700' : '#FF6B6B'} emissive={isWinning ? '#FFD700' : '#FF6B6B'} emissiveIntensity={0.3} />
          </Box>
        </group>
      )}
      
      {value === 'O' && (
        <Torus
          ref={meshRef}
          args={[0.5, 0.15, 16, 32]}
          position={[0, 0.5, 0]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <meshStandardMaterial color={isWinning ? '#FFD700' : '#4ECDC4'} emissive={isWinning ? '#FFD700' : '#4ECDC4'} emissiveIntensity={0.3} />
        </Torus>
      )}
    </group>
  );
};

const Board: React.FC<Board3DProps> = ({ board, onCellClick, winningLine }) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.1;
    }
  });

  const isWinningCell = (position: Position) => {
    return winningLine?.some(
      (p) => p.layer === position.layer && p.row === position.row && p.col === position.col
    ) || false;
  };

  return (
    <group ref={groupRef}>
      {board.map((layer, layerIndex) =>
        layer.map((row, rowIndex) =>
          row.map((cell, colIndex) => {
            const position: Position = {
              layer: layerIndex,
              row: rowIndex,
              col: colIndex,
            };
            return (
              <Cell
                key={`${layerIndex}-${rowIndex}-${colIndex}`}
                position={position}
                value={cell}
                onClick={() => onCellClick(position)}
                isWinning={isWinningCell(position)}
              />
            );
          })
        )
      )}
    </group>
  );
};

const Board3D: React.FC<Board3DProps> = ({ board, onCellClick, winningLine }) => {
  return (
    <div style={{ width: '100%', height: '600px' }}>
      <Canvas camera={{ position: [8, 8, 8], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />
        <Board board={board} onCellClick={onCellClick} winningLine={winningLine} />
        <OrbitControls
          enablePan={false}
          minDistance={5}
          maxDistance={20}
          autoRotate
          autoRotateSpeed={0.5}
        />
      </Canvas>
    </div>
  );
};

export default Board3D;