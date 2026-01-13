'use client'

import { useRef, useMemo, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Points, PointMaterial, Float, Grid } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'

function generateSpherePoints(count: number, radius: number) {
    const points = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
        // Random point in sphere
        const u = Math.random()
        const v = Math.random()
        const theta = 2 * Math.PI * u
        const phi = Math.acos(2 * v - 1)
        const r = Math.cbrt(Math.random()) * radius

        const x = r * Math.sin(phi) * Math.cos(theta)
        const y = r * Math.sin(phi) * Math.sin(theta)
        const z = r * Math.cos(phi)

        points[i * 3] = x
        points[i * 3 + 1] = y
        points[i * 3 + 2] = z
    }
    return points
}

function StarField(props: any) {
    const ref = useRef<any>()
    const [sphere] = useState(() => generateSpherePoints(5000, 1.5))

    useFrame((state, delta) => {
        if (ref.current) {
            ref.current.rotation.x -= delta / 10
            ref.current.rotation.y -= delta / 15
        }
    })

    return (
        <group rotation={[0, 0, Math.PI / 4]}>
            <Points ref={ref} positions={sphere} stride={3} frustumCulled={false} {...props}>
                <PointMaterial
                    transparent
                    color="#a78bfa"
                    size={0.002}
                    sizeAttenuation={true}
                    depthWrite={false}
                />
            </Points>
        </group>
    )
}

function VaporGrid() {
    return (
        <group position={[0, -2, 0]} rotation={[Math.PI / 2.5, 0, 0]}>
            <Grid
                renderOrder={-1}
                position={[0, 0, 0]}
                infiniteGrid
                cellSize={1}
                sectionSize={3}
                fadeDistance={30}
                sectionColor="#4c1d95"
                cellColor="#2e1065"
            />
        </group>
    )
}

export default function Scene() {
    return (
        <div className="fixed inset-0 z-[-1]">
            <Canvas camera={{ position: [0, 0, 1] }}>
                <color attach="background" args={['#000']} />

                {/* 3D Elements */}
                <StarField />
                <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
                    <VaporGrid />
                </Float>

                {/* Post Processing */}
                <EffectComposer>
                    <Bloom luminanceThreshold={0} luminanceSmoothing={0.9} height={300} intensity={0.5} />
                </EffectComposer>
            </Canvas>
        </div>
    )
}
