'use client'

import dynamic from 'next/dynamic'

const Scene = dynamic(() => import('@/components/3d/Scene'), { ssr: false })

export default function SceneWrapper() {
    return <Scene />
}
