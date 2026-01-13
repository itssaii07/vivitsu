'use client'

import { useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Icosahedron, MeshDistortMaterial } from '@react-three/drei'

function DataGem(props: any) {
    const mesh = useRef<any>(null)
    const [hovered, setHover] = useState(false)

    useFrame((state, delta) => {
        if (mesh.current) {
            mesh.current.rotation.x += delta * 0.5
            mesh.current.rotation.y += delta * 0.5
            // Speed up on hover
            if (hovered) {
                mesh.current.rotation.y += delta * 2
            }
        }
    })

    return (
        <Icosahedron
            args={[1, 0]}
            ref={mesh}
            onPointerOver={() => setHover(true)}
            onPointerOut={() => setHover(false)}
            scale={hovered ? 1.2 : 1}
            {...props}
        >
            <MeshDistortMaterial
                color={hovered ? "#a78bfa" : "#8b5cf6"} // violet-400 : violet-500
                attach="material"
                distort={0.4} // Strength, 0 disables the effect (default=1)
                speed={2} // Speed (default=1)
                roughness={0.2}
                metalness={0.8}
            />
        </Icosahedron>

    )
}

export default function Logo3D() {
    return (
        <div className="w-12 h-12 relative cursor-pointer">
            <Canvas camera={{ position: [0, 0, 3] }}>
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1.5} />
                <DataGem />
            </Canvas>
        </div>
    )
}
