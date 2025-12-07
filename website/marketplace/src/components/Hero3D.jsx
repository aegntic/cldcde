
import { useState, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import {
    Text,
    Environment,
    Float,
    useCursor,
    MeshTransmissionMaterial,
    RoundedBox,
    MeshReflectorMaterial
} from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'
import { useNavigate } from 'react-router-dom'
import './HeroPanel.css'

// Advanced Glass Tile Component
function GlassTile({ position, label, onClick, delay = 0 }) {
    const mesh = useRef()
    const [hovered, setHover] = useState(false)
    useCursor(hovered)

    useFrame((state) => {
        if (!mesh.current) return

        // Smooth scale transition
        const targetScale = hovered ? 1.1 : 1
        mesh.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1)

        // Dynamic tilt based on mouse position (subtle)
        // We could add more complex interaction here
    })

    return (
        <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5} floatingRange={[-0.1, 0.1]}>
            <group position={position}>
                {/* The Glass Block */}
                <RoundedBox
                    ref={mesh}
                    args={[1.8, 1.8, 0.2]} // Width, Height, Depth
                    radius={0.05} // Rounded corners
                    smoothness={4}
                    onClick={onClick}
                    onPointerOver={() => setHover(true)}
                    onPointerOut={() => setHover(false)}
                >
                    <MeshTransmissionMaterial
                        backside
                        backsideThickness={0.5}
                        thickness={2}
                        chromaticAberration={0.5}
                        anisotropy={0.5}
                        distortion={0.5}
                        distortionScale={0.5}
                        temporalDistortion={0.1}
                        iridescence={1}
                        iridescenceIOR={1}
                        iridescenceThicknessRange={[0, 1400]}
                        roughness={0.1}
                        metalness={0.1}
                        color={hovered ? "#ffaa88" : "#ffffff"} // Tint on hover
                        toneMapped={false}
                    />
                </RoundedBox>

                {/* Glowing Edge/Border */}
                <RoundedBox args={[1.82, 1.82, 0.18]} radius={0.05} smoothness={4}>
                    <meshBasicMaterial
                        color="#e86d3d"
                        wireframe={true}
                        transparent
                        opacity={0.5}
                        toneMapped={false}
                    />
                </RoundedBox>

                {/* Label Text */}
                <Text
                    position={[0, 0, 0.15]}
                    fontSize={0.25}
                    color="#ffffff"
                    anchorX="center"
                    anchorY="middle"
                    outlineWidth={0.01}
                    outlineColor="#e86d3d"
                    toneMapped={false} // Important for bloom
                >
                    {label}
                </Text>
            </group>
        </Float>
    )
}

// Main 3D Scene
function Scene() {
    const handleCategoryClick = (category) => {
        const element = document.getElementById(category.toLowerCase())
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' })
        }
    }

    const categories = [
        { id: 'Plugins', label: 'PLUGINS', x: -4.4 },
        { id: 'MCPs', label: 'MCPS', x: -2.2 },
        { id: 'Skills', label: 'SKILLS', x: 0 },
        { id: 'Prompts', label: 'PROMPTS', x: 2.2 },
        { id: 'Workflows', label: 'WORKFLOWS', x: 4.4 }
    ]

    return (
        <>
            {/* Lighting */}
            <ambientLight intensity={0.2} />
            <pointLight position={[10, 10, 10]} intensity={2} color="#e86d3d" />
            <pointLight position={[-10, -10, -10]} intensity={2} color="#3a8fd1" />
            <spotLight position={[0, 10, 0]} intensity={5} angle={0.5} penumbra={1} color="#ffffff" />

            {/* Environment for reflections */}
            <Environment preset="city" />

            {/* Tiles */}
            <group position={[0, 0, 0]}>
                {categories.map((cat, index) => (
                    <GlassTile
                        key={cat.id}
                        position={[cat.x, 0, 0]}
                        label={cat.label}
                        onClick={() => handleCategoryClick(cat.id)}
                        delay={index * 0.1}
                    />
                ))}
            </group>

            {/* Reflective Floor */}
            <mesh position={[0, -2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[50, 50]} />
                <MeshReflectorMaterial
                    blur={[300, 100]}
                    resolution={1024}
                    mixBlur={1}
                    mixStrength={40}
                    roughness={1}
                    depthScale={1.2}
                    minDepthThreshold={0.4}
                    maxDepthThreshold={1.4}
                    color="#050505"
                    metalness={0.5}
                />
            </mesh>

            {/* Post Processing */}
            <EffectComposer disableNormalPass>
                <Bloom
                    luminanceThreshold={1} // Only very bright things glow
                    mipmapBlur
                    intensity={1.5}
                    radius={0.4}
                />
            </EffectComposer>
        </>
    )
}

function Hero3D() {
    const [searchQuery, setSearchQuery] = useState('')

    const handleSearch = (e) => {
        e.preventDefault()
        console.log('Searching for:', searchQuery)
    }

    return (
        <div className="hero-panel" style={{ height: '600px', background: '#000' }}>
            <Canvas camera={{ position: [0, 1, 8], fov: 45 }} dpr={[1, 2]}>
                <Scene />
            </Canvas>

            {/* Overlay Elements */}
            <div className="hero-panel-overlay" style={{ pointerEvents: 'none' }}>
                <div style={{
                    position: 'absolute',
                    top: '10%',
                    width: '100%',
                    textAlign: 'center',
                    pointerEvents: 'auto'
                }}>
                    <h1 className="pixel-header" style={{
                        fontSize: '3rem',
                        color: '#e86d3d',
                        textShadow: '0 0 30px rgba(232, 109, 61, 0.8)',
                        marginBottom: '2rem',
                        fontFamily: "'Press Start 2P', monospace"
                    }}>
                        CLAUDE CODE MARKETPLACE
                    </h1>

                    <form onSubmit={handleSearch} style={{
                        display: 'inline-block',
                        width: '50%',
                        position: 'relative'
                    }}>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search for models, scripts, and tools..."
                            className="hero-search-input"
                            style={{
                                background: 'rgba(0, 0, 0, 0.6)',
                                backdropFilter: 'blur(10px)',
                                border: '1px solid rgba(232, 109, 61, 0.5)',
                                height: '50px',
                                fontSize: '1rem',
                                boxShadow: '0 0 20px rgba(232, 109, 61, 0.2)'
                            }}
                        />
                    </form>
                </div>

                {/* Footer Info Section */}
                <div className="hero-footer-info">
                    <div className="hero-info-col">
                        <h3 className="hero-info-title">
                            <span className="hero-icon">⚖️</span> FREEMIUM MODEL
                        </h3>
                        <p className="hero-info-text">Access core tools for free.</p>
                        <p className="hero-info-text">Unlock premium models and advanced features with affordable subscription tiers or one-time purchases.</p>
                    </div>
                    <div className="hero-info-col">
                        <h3 className="hero-info-title">
                            <span className="hero-icon">💡</span> QUICK TIPS
                        </h3>
                        <p className="hero-info-text">Use search to find specific tools.</p>
                        <p className="hero-info-text">Filter by category (e.g., Skills, Prompts).</p>
                        <p className="hero-info-text">Check compatibility before purchase.</p>
                        <p className="hero-info-text">Review community ratings.</p>
                    </div>
                    <div className="hero-info-col">
                        <h3 className="hero-info-title">FEATURED FREE & PAID</h3>
                        <div className="hero-featured-grid">
                            <div className="hero-featured-item">
                                <div className="hero-featured-icon">{'</>'}</div>
                                <span className="hero-featured-label">Free: Basic Code Refactor Script</span>
                            </div>
                            <div className="hero-featured-item">
                                <div className="hero-featured-icon">📝</div>
                                <span className="hero-featured-label">Free: Daily Prompt Generator</span>
                            </div>
                            <div className="hero-featured-item">
                                <div className="hero-featured-icon">📊</div>
                                <span className="hero-featured-label">Paid: Advanced Data Analysis Model ($20.00)</span>
                            </div>
                            <div className="hero-featured-item">
                                <div className="hero-featured-icon">🤖</div>
                                <span className="hero-featured-label">Paid: AI Workflow Orchestrator ($40.00)</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Hero3D
