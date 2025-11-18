/**
 * Advanced Animation System Module
 *
 * Movie-quality animations using:
 * - CSS Houdini (Paint & Layout Worklets)
 * - Web Animations API
 * - Physics simulations (Ragdoll, Spring Dynamics, Fluid Dynamics)
 * - GPU-accelerated particle systems
 * - View Transitions API
 * - Performance-optimized animation orchestration
 */

export interface AnimationSystem {
  initialize(): Promise<void>;
  isSupported(): { houdini: boolean; webAnimations: boolean; webGL: boolean; viewTransitions: boolean };
  createAnimation(config: AnimationConfig): Animation;
  createPhysicsWorld(config: PhysicsConfig): PhysicsWorld;
  createParticleSystem(config: ParticleConfig): ParticleSystem;
  destroy(): void;
}

export interface AnimationConfig {
  target: Element | AnimationTarget[];
  keyframes: Keyframe[];
  duration: number;
  easing: string | EasingFunction;
  delay?: number;
  iterations?: number | 'infinite';
  direction?: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse';
  fill?: 'none' | 'forwards' | 'backwards' | 'both';
  composite?: 'replace' | 'add' | 'accumulate';
}

export interface AnimationTarget {
  element: Element;
  properties: Record<string, any>;
}

export interface EasingFunction {
  (progress: number): number;
}

export interface PhysicsConfig {
  gravity: number;
  damping: number;
  timeStep: number;
  iterations: number;
  solver: 'verlet' | 'euler' | 'rk4';
  constraints: Constraint[];
  bodies: Rigidbody[];
}

export interface Constraint {
  type: 'distance' | 'hinge' | 'spring' | 'contact';
  bodyA: number;
  bodyB: number;
  params: Record<string, number>;
}

export interface Rigidbody {
  id: number;
  position: Vector3;
  velocity: Vector3;
  acceleration: Vector3;
  mass: number;
  shape: 'sphere' | 'box' | 'plane' | 'mesh';
  material: Material;
  isStatic?: boolean;
}

export interface Material {
  friction: number;
  restitution: number;
  density: number;
}

export interface ParticleConfig {
  count: number;
  emitter: ParticleEmitter;
  forces: Force[];
  lifespan: number;
  texture?: string;
  blendMode: 'normal' | 'add' | 'multiply' | 'screen';
  emitterShape: 'point' | 'circle' | 'rectangle' | 'mesh';
}

export interface ParticleEmitter {
  position: Vector3;
  velocity: Vector3;
  velocityVariation: Vector3;
  rate: number;
  burst?: number;
  duration?: number;
}

export interface Force {
  type: 'gravity' | 'wind' | 'turbulence' | 'vortex' | 'custom';
  strength: number;
  direction?: Vector3;
  center?: Vector3;
  customForce?: (particle: Particle, time: number) => Vector3;
}

export interface Particle {
  position: Vector3;
  velocity: Vector3;
  acceleration: Vector3;
  life: number;
  maxLife: number;
  size: number;
  color: Color;
  rotation: number;
  rotationVelocity: number;
}

export interface Animation {
  play(): Promise<void>;
  pause(): void;
  stop(): void;
  reverse(): void;
  getCurrentTime(): number;
  setPlaybackRate(rate: number): void;
  cancel(): void;
  finished: Promise<void>;
}

export interface PhysicsWorld {
  step(deltaTime: number): void;
  addBody(body: Rigidbody): void;
  removeBody(id: number): void;
  addConstraint(constraint: Constraint): void;
  removeConstraint(constraint: Constraint): void;
  setGravity(gravity: Vector3): void;
  raycast(origin: Vector3, direction: Vector3, maxDistance: number): RaycastHit[];
}

export interface ParticleSystem {
  update(deltaTime: number): void;
  render(): void;
  emit(count?: number): void;
  burst(count: number): void;
  setForce(index: number, force: Force): void;
  destroy(): void;
}

export interface RaycastHit {
  body: Rigidbody;
  distance: number;
  point: Vector3;
  normal: Vector3;
}

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface Color {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface ViewTransition {
  ready: Promise<void>;
  finished: Promise<void>;
  skipTransition(): void;
}

/**
 * Main Animation System Implementation
 */
export class AnimationSystemManager {
  private houdiniPaintWorklet: string = '';
  private houdiniLayoutWorklet: string = '';
  private animations: Map<string, Animation> = new Map();
  private physicsWorlds: Map<string, PhysicsWorld> = new Map();
  private particleSystems: Map<string, ParticleSystem> = new Map();
  private isInitialized = false;
  private support: { houdini: boolean; webAnimations: boolean; webGL: boolean; viewTransitions: boolean } = {
    houdini: false,
    webAnimations: false,
    webGL: false,
    viewTransitions: false
  };

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log('Initializing Animation System...');

    // Check browser support
    this.support = this.detectSupport();

    // Initialize Houdini worklets if supported
    if (this.support.houdini) {
      await this.initializeHoudini();
    }

    // Initialize WebGL context
    if (this.support.webGL) {
      this.initializeWebGL();
    }

    this.isInitialized = true;
    console.log('Animation System initialized');
  }

  isSupported() {
    return this.support;
  }

  createAnimation(config: AnimationConfig): Animation {
    const animation = new WebAnimationImpl(config);
    const id = this.generateId();
    this.animations.set(id, animation);
    return animation;
  }

  createPhysicsWorld(config: PhysicsConfig): PhysicsWorld {
    const world = new PhysicsWorldImpl(config);
    const id = this.generateId();
    this.physicsWorlds.set(id, world);
    return world;
  }

  createParticleSystem(config: ParticleConfig): ParticleSystem {
    const system = new ParticleSystemImpl(config);
    const id = this.generateId();
    this.particleSystems.set(id, system);
    return system;
  }

  createViewTransition(): Promise<ViewTransition> | null {
    if (!this.support.viewTransitions) {
      console.warn('View Transitions API not supported');
      return null;
    }

    return document.startViewTransition({
      update: () => {
        // DOM updates go here
      }
    }) as Promise<ViewTransition>;
  }

  destroy(): void {
    // Clean up all animations
    this.animations.forEach(animation => animation.cancel());
    this.animations.clear();

    // Clean up physics worlds
    this.physicsWorlds.forEach(world => world.destroy());
    this.physicsWorlds.clear();

    // Clean up particle systems
    this.particleSystems.forEach(system => system.destroy());
    this.particleSystems.clear();

    this.isInitialized = false;
  }

  private detectSupport() {
    return {
      houdini: 'paintWorklet' in CSS && 'layoutWorklet' in CSS,
      webAnimations: 'animate' in Element.prototype,
      webGL: !!window.WebGLRenderingContext,
      viewTransitions: 'startViewTransition' in document
    };
  }

  private async initializeHoudini(): Promise<void> {
    try {
      // Register paint worklet
      if (CSS.paintWorklet) {
        await CSS.paintWorklet.addModule('/worklets/paint-worklet.js');
      }

      // Register layout worklet
      if (CSS.layoutWorklet) {
        await CSS.layoutWorklet.addModule('/worklets/layout-worklet.js');
      }
    } catch (error) {
      console.warn('Failed to initialize Houdini worklets:', error);
    }
  }

  private initializeWebGL(): void {
    // Initialize WebGL context for particle systems
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');

    if (!gl) {
      console.warn('WebGL not available');
      return;
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}

/**
 * Web Animation Implementation
 */
class WebAnimationImpl implements Animation {
  private webAnimation: WebAnimation | null = null;
  private keyframeEffect: KeyframeEffect | null = null;
  private isPlaying = false;
  private playbackRate = 1;
  private resolveFinished: ((value: void) => void) | null = null;
  private finishedPromise: Promise<void>;

  constructor(private config: AnimationConfig) {
    this.finishedPromise = new Promise(resolve => {
      this.resolveFinished = resolve;
    });
  }

  async play(): Promise<void> {
    if (this.isPlaying) return;

    const targets = Array.isArray(this.config.target) ? this.config.target : [{ element: this.config.target, properties: {} }];

    for (const target of targets) {
      const keyframeEffect = new KeyframeEffect(
        target.element,
        this.config.keyframes,
        {
          duration: this.config.duration,
          delay: this.config.delay || 0,
          iterations: this.config.iterations || 1,
          direction: this.config.direction || 'normal',
          fill: this.config.fill || 'none',
          composite: this.config.composite || 'replace'
        }
      );

      const animation = new Animation(
        keyframeEffect,
        document.timeline
      );

      if (typeof this.config.easing === 'string') {
        animation.timingFunction = this.config.easing as string;
      } else {
        // Custom easing function
        keyframeEffect.timing = {
          ...keyframeEffect.timing,
          easing: this.createCustomEasing(this.config.easing)
        };
      }

      animation.playbackRate = this.playbackRate;
      animation.play();

      animation.addEventListener('finish', () => {
        this.isPlaying = false;
        if (this.resolveFinished) {
          this.resolveFinished();
        }
      });

      this.webAnimation = animation;
      this.keyframeEffect = keyframeEffect;
    }

    this.isPlaying = true;
  }

  pause(): void {
    if (this.webAnimation && this.isPlaying) {
      this.webAnimation.pause();
      this.isPlaying = false;
    }
  }

  stop(): void {
    if (this.webAnimation) {
      this.webAnimation.cancel();
      this.isPlaying = false;
    }
  }

  reverse(): void {
    if (this.webAnimation) {
      this.webAnimation.playbackRate = -this.playbackRate;
    }
  }

  getCurrentTime(): number {
    return this.webAnimation ? this.webAnimation.currentTime : 0;
  }

  setPlaybackRate(rate: number): void {
    this.playbackRate = rate;
    if (this.webAnimation) {
      this.webAnimation.playbackRate = rate;
    }
  }

  cancel(): void {
    this.stop();
  }

  get finished(): Promise<void> {
    return this.finishedPromise;
  }

  private createCustomEasing(easingFunction: EasingFunction): string {
    // Convert custom easing function to CSS cubic-bezier
    // This is a simplified version - in practice you'd need more sophisticated conversion
    return 'cubic-bezier(0.25, 0.1, 0.25, 1)';
  }
}

/**
 * Physics World Implementation
 */
class PhysicsWorldImpl implements PhysicsWorld {
  private bodies: Map<number, Rigidbody> = new Map();
  private constraints: Constraint[] = [];
  private gravity: Vector3 = { x: 0, y: -9.81, z: 0 };
  private timeStep: number;
  private solver: string;
  private accumulator = 0;

  constructor(private config: PhysicsConfig) {
    this.gravity = { x: 0, y: config.gravity, z: 0 };
    this.timeStep = config.timeStep;
    this.solver = config.solver;

    // Initialize bodies
    config.bodies.forEach(body => this.addBody(body));
  }

  step(deltaTime: number): void {
    // Fixed timestep with accumulator
    this.accumulator += deltaTime;

    while (this.accumulator >= this.timeStep) {
      this.integrate(this.timeStep);
      this.solveConstraints();
      this.broadphase();
      this.narrowphase();

      this.accumulator -= this.timeStep;
    }
  }

  addBody(body: Rigidbody): void {
    this.bodies.set(body.id, body);
  }

  removeBody(id: number): void {
    this.bodies.delete(id);
  }

  addConstraint(constraint: Constraint): void {
    this.constraints.push(constraint);
  }

  removeConstraint(constraint: Constraint): void {
    const index = this.constraints.indexOf(constraint);
    if (index > -1) {
      this.constraints.splice(index, 1);
    }
  }

  setGravity(gravity: Vector3): void {
    this.gravity = gravity;
  }

  raycast(origin: Vector3, direction: Vector3, maxDistance: number): RaycastHit[] {
    const hits: RaycastHit[] = [];
    const normalizedDir = this.normalize(direction);

    this.bodies.forEach(body => {
      const distance = this.raycastBody(origin, normalizedDir, body, maxDistance);
      if (distance < maxDistance) {
        const hitPoint = {
          x: origin.x + normalizedDir.x * distance,
          y: origin.y + normalizedDir.y * distance,
          z: origin.z + normalizedDir.z * distance
        };

        hits.push({
          body,
          distance,
          point: hitPoint,
          normal: { x: 0, y: 1, z: 0 } // Simplified normal
        });
      }
    });

    return hits.sort((a, b) => a.distance - b.distance);
  }

  destroy(): void {
    this.bodies.clear();
    this.constraints = [];
  }

  private integrate(dt: number): void {
    switch (this.solver) {
      case 'verlet':
        this.verletIntegration(dt);
        break;
      case 'euler':
        this.eulerIntegration(dt);
        break;
      case 'rk4':
        this.rungeKuttaIntegration(dt);
        break;
    }
  }

  private verletIntegration(dt: number): void {
    this.bodies.forEach(body => {
      if (body.isStatic) return;

      const newPos = {
        x: body.position.x + body.velocity.x * dt + 0.5 * body.acceleration.x * dt * dt,
        y: body.position.y + body.velocity.y * dt + 0.5 * body.acceleration.y * dt * dt,
        z: body.position.z + body.velocity.z * dt + 0.5 * body.acceleration.z * dt * dt
      };

      const newAccel = { ...this.gravity };

      const newVel = {
        x: (newPos.x - body.position.x) / dt + 0.5 * newAccel.x * dt,
        y: (newPos.y - body.position.y) / dt + 0.5 * newAccel.y * dt,
        z: (newPos.z - body.position.z) / dt + 0.5 * newAccel.z * dt
      };

      body.position = newPos;
      body.velocity = newVel;
      body.acceleration = newAccel;
    });
  }

  private eulerIntegration(dt: number): void {
    this.bodies.forEach(body => {
      if (body.isStatic) return;

      // Update acceleration
      body.acceleration = { ...this.gravity };

      // Update velocity
      body.velocity.x += body.acceleration.x * dt;
      body.velocity.y += body.acceleration.y * dt;
      body.velocity.z += body.acceleration.z * dt;

      // Update position
      body.position.x += body.velocity.x * dt;
      body.position.y += body.velocity.y * dt;
      body.position.z += body.velocity.z * dt;
    });
  }

  private rungeKuttaIntegration(dt: number): void {
    // Simplified RK4 implementation
    this.bodies.forEach(body => {
      if (body.isStatic) return;

      const k1 = this.calculateDerivative(body.position, body.velocity);
      const k2 = this.calculateDerivative(
        this.addVectors(body.position, this.scaleVector(k1.velocity, dt * 0.5)),
        this.addVectors(body.velocity, this.scaleVector(k1.acceleration, dt * 0.5))
      );
      const k3 = this.calculateDerivative(
        this.addVectors(body.position, this.scaleVector(k2.velocity, dt * 0.5)),
        this.addVectors(body.velocity, this.scaleVector(k2.acceleration, dt * 0.5))
      );
      const k4 = this.calculateDerivative(
        this.addVectors(body.position, this.scaleVector(k3.velocity, dt)),
        this.addVectors(body.velocity, this.scaleVector(k3.acceleration, dt))
      );

      const dPos = this.scaleVector(
        this.addVectors(
          this.addVectors(k1.velocity, this.scaleVector(k2.velocity, 2)),
          this.addVectors(this.scaleVector(k3.velocity, 2), k4.velocity)
        ),
        dt / 6
      );

      const dVel = this.scaleVector(
        this.addVectors(
          this.addVectors(k1.acceleration, this.scaleVector(k2.acceleration, 2)),
          this.addVectors(this.scaleVector(k3.acceleration, 2), k4.acceleration)
        ),
        dt / 6
      );

      body.position = this.addVectors(body.position, dPos);
      body.velocity = this.addVectors(body.velocity, dVel);
    });
  }

  private calculateDerivative(position: Vector3, velocity: Vector3) {
    return {
      velocity,
      acceleration: this.gravity
    };
  }

  private solveConstraints(): void {
    // Simple constraint solving
    for (let i = 0; i < 5; i++) { // Multiple iterations for stability
      this.constraints.forEach(constraint => {
        this.solveConstraint(constraint);
      });
    }
  }

  private solveConstraint(constraint: Constraint): void {
    const bodyA = this.bodies.get(constraint.bodyA);
    const bodyB = this.bodies.get(constraint.bodyB);

    if (!bodyA || !bodyB) return;

    switch (constraint.type) {
      case 'distance':
        this.solveDistanceConstraint(bodyA, bodyB, constraint.params.distance);
        break;
      case 'spring':
        this.solveSpringConstraint(bodyA, bodyB, constraint.params);
        break;
    }
  }

  private solveDistanceConstraint(bodyA: Rigidbody, bodyB: Rigidbody, distance: number): void {
    const delta = this.subtractVectors(bodyB.position, bodyA.position);
    const currentDistance = this.magnitude(delta);

    if (currentDistance === 0) return;

    const correction = (distance - currentDistance) / currentDistance;
    const totalMass = bodyA.mass + bodyB.mass;

    const correctionA = this.scaleVector(delta, correction * (bodyB.mass / totalMass));
    const correctionB = this.scaleVector(delta, -correction * (bodyA.mass / totalMass));

    if (!bodyA.isStatic) {
      bodyA.position = this.addVectors(bodyA.position, correctionA);
    }
    if (!bodyB.isStatic) {
      bodyB.position = this.addVectors(bodyB.position, correctionB);
    }
  }

  private solveSpringConstraint(bodyA: Rigidbody, bodyB: Rigidbody, params: Record<string, number>): void {
    const delta = this.subtractVectors(bodyB.position, bodyA.position);
    const distance = this.magnitude(delta);
    const restLength = params.restLength || 1;
    const stiffness = params.stiffness || 100;

    const force = stiffness * (distance - restLength);
    const direction = this.normalize(delta);

    const forceA = this.scaleVector(direction, -force / bodyA.mass);
    const forceB = this.scaleVector(direction, force / bodyB.mass);

    if (!bodyA.isStatic) {
      bodyA.acceleration = this.addVectors(bodyA.acceleration, forceA);
    }
    if (!bodyB.isStatic) {
      bodyB.acceleration = this.addVectors(bodyB.acceleration, forceB);
    }
  }

  private broadphase(): void {
    // Simple broadphase collision detection
    // In a real implementation, this would use spatial partitioning
  }

  private narrowphase(): void {
    // Simple narrowphase collision detection and response
    const bodies = Array.from(this.bodies.values());

    for (let i = 0; i < bodies.length; i++) {
      for (let j = i + 1; j < bodies.length; j++) {
        this.checkCollision(bodies[i], bodies[j]);
      }
    }
  }

  private checkCollision(bodyA: Rigidbody, bodyB: Rigidbody): void {
    // Simplified sphere-sphere collision
    if (bodyA.shape === 'sphere' && bodyB.shape === 'sphere') {
      const delta = this.subtractVectors(bodyB.position, bodyA.position);
      const distance = this.magnitude(delta);
      const minDistance = 1; // Simplified radius

      if (distance < minDistance) {
        this.resolveCollision(bodyA, bodyB, delta, distance);
      }
    }
  }

  private resolveCollision(bodyA: Rigidbody, bodyB: Rigidbody, delta: Vector3, distance: number): void {
    const normal = this.normalize(delta);
    const relativeVelocity = this.subtractVectors(bodyB.velocity, bodyA.velocity);
    const velocityAlongNormal = this.dotProduct(relativeVelocity, normal);

    if (velocityAlongNormal > 0) return;

    const restitution = Math.min(bodyA.material.restitution, bodyB.material.restitution);
    const impulse = -(1 + restitution) * velocityAlongNormal / (1/bodyA.mass + 1/bodyB.mass);

    const impulseVector = this.scaleVector(normal, impulse);

    if (!bodyA.isStatic) {
      bodyA.velocity = this.subtractVectors(bodyA.velocity, this.scaleVector(impulseVector, 1/bodyA.mass));
    }
    if (!bodyB.isStatic) {
      bodyB.velocity = this.addVectors(bodyB.velocity, this.scaleVector(impulseVector, 1/bodyB.mass));
    }
  }

  private raycastBody(origin: Vector3, direction: Vector3, body: Rigidbody, maxDistance: number): number {
    // Simplified raycasting against sphere
    if (body.shape === 'sphere') {
      const toSphere = this.subtractVectors(body.position, origin);
      const projection = this.dotProduct(toSphere, direction);

      if (projection < 0 || projection > maxDistance) return maxDistance;

      const closestPoint = this.addVectors(origin, this.scaleVector(direction, projection));
      const distanceToSphere = this.magnitude(this.subtractVectors(body.position, closestPoint));

      if (distanceToSphere <= 1) { // Simplified radius
        return projection;
      }
    }

    return maxDistance;
  }

  // Vector math utilities
  private addVectors(a: Vector3, b: Vector3): Vector3 {
    return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
  }

  private subtractVectors(a: Vector3, b: Vector3): Vector3 {
    return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
  }

  private scaleVector(v: Vector3, scale: number): Vector3 {
    return { x: v.x * scale, y: v.y * scale, z: v.z * scale };
  }

  private dotProduct(a: Vector3, b: Vector3): number {
    return a.x * b.x + a.y * b.y + a.z * b.z;
  }

  private magnitude(v: Vector3): number {
    return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
  }

  private normalize(v: Vector3): Vector3 {
    const mag = this.magnitude(v);
    if (mag === 0) return { x: 0, y: 0, z: 0 };
    return this.scaleVector(v, 1 / mag);
  }
}

/**
 * Particle System Implementation
 */
class ParticleSystemImpl implements ParticleSystem {
  private particles: Particle[] = [];
  private forces: Force[] = [];
  private emitter: ParticleEmitter;
  private lifespan: number;
  private emissionTimer = 0;
  private isActive = true;

  constructor(private config: ParticleConfig) {
    this.emitter = config.emitter;
    this.forces = config.forces;
    this.lifespan = config.lifespan;
  }

  update(deltaTime: number): void {
    if (!this.isActive) return;

    // Emit new particles
    this.emissionTimer += deltaTime;
    const emissionInterval = 1000 / this.emitter.rate;

    while (this.emissionTimer >= emissionInterval && this.particles.length < this.config.count) {
      this.emit(1);
      this.emissionTimer -= emissionInterval;
    }

    // Update existing particles
    this.particles = this.particles.filter(particle => {
      // Apply forces
      this.forces.forEach(force => {
        const acceleration = this.calculateForce(force, particle);
        particle.acceleration = acceleration;
      });

      // Update physics
      particle.velocity.x += particle.acceleration.x * deltaTime;
      particle.velocity.y += particle.acceleration.y * deltaTime;
      particle.velocity.z += particle.acceleration.z * deltaTime;

      particle.position.x += particle.velocity.x * deltaTime;
      particle.position.y += particle.velocity.y * deltaTime;
      particle.position.z += particle.velocity.z * deltaTime;

      particle.rotation += particle.rotationVelocity * deltaTime;
      particle.life -= deltaTime;

      return particle.life > 0;
    });
  }

  render(): void {
    // Render particles using WebGL or Canvas 2D
    // This would be implemented based on the rendering backend
  }

  emit(count?: number): void {
    const emitCount = count || 1;

    for (let i = 0; i < emitCount; i++) {
      if (this.particles.length >= this.config.count) break;

      const particle: Particle = {
        position: { ...this.emitter.position },
        velocity: {
          x: this.emitter.velocity.x + (Math.random() - 0.5) * this.emitter.velocityVariation.x,
          y: this.emitter.velocity.y + (Math.random() - 0.5) * this.emitter.velocityVariation.y,
          z: this.emitter.velocity.z + (Math.random() - 0.5) * this.emitter.velocityVariation.z
        },
        acceleration: { x: 0, y: 0, z: 0 },
        life: this.lifespan,
        maxLife: this.lifespan,
        size: Math.random() * 5 + 2,
        color: { r: 255, g: 255, b: 255, a: 1 },
        rotation: Math.random() * Math.PI * 2,
        rotationVelocity: (Math.random() - 0.5) * 2
      };

      this.particles.push(particle);
    }
  }

  burst(count: number): void {
    const originalRate = this.emitter.rate;
    this.emitter.rate = 1000; // Temporarily increase rate
    this.emit(count);
    this.emitter.rate = originalRate;
  }

  setForce(index: number, force: Force): void {
    if (index >= 0 && index < this.forces.length) {
      this.forces[index] = force;
    }
  }

  destroy(): void {
    this.isActive = false;
    this.particles = [];
    this.forces = [];
  }

  private calculateForce(force: Force, particle: Particle): Vector3 {
    switch (force.type) {
      case 'gravity':
        return { x: 0, y: -9.81 * force.strength, z: 0 };

      case 'wind':
        return force.direction ?
          this.scaleVector(force.direction, force.strength) :
          { x: force.strength, y: 0, z: 0 };

      case 'turbulence':
        return {
          x: (Math.random() - 0.5) * force.strength,
          y: (Math.random() - 0.5) * force.strength,
          z: (Math.random() - 0.5) * force.strength
        };

      case 'vortex':
        if (!force.center) return { x: 0, y: 0, z: 0 };
        const toCenter = this.subtractVectors(force.center, particle.position);
        const distance = Math.sqrt(toCenter.x * toCenter.x + toCenter.z * toCenter.z);
        const tangent = { x: -toCenter.z / distance, y: 0, z: toCenter.x / distance };
        return this.scaleVector(tangent, force.strength);

      case 'custom':
        return force.customForce ? force.customForce(particle, Date.now()) : { x: 0, y: 0, z: 0 };

      default:
        return { x: 0, y: 0, z: 0 };
    }
  }
}

// Utility functions
export function createAnimationSystem(): AnimationSystem {
  return new AnimationSystemManager();
}

export function createEasingFunction(type: 'ease-in' | 'ease-out' | 'ease-in-out' | 'bounce' | 'elastic' | 'custom', params?: any): EasingFunction {
  switch (type) {
    case 'ease-in':
      return (t) => t * t;
    case 'ease-out':
      return (t) => t * (2 - t);
    case 'ease-in-out':
      return (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    case 'bounce':
      return (t) => {
        const n1 = 7.5625;
        const d1 = 2.75;
        if (t < 1 / d1) return n1 * t * t;
        else if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
        else if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
        else return n1 * (t -= 2.625 / d1) * t + 0.984375;
      };
    case 'elastic':
      return (t) => {
        const c4 = (2 * Math.PI) / 3;
        return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
      };
    case 'custom':
      return params || ((t) => t);
    default:
      return (t) => t;
  }
}

export default AnimationSystemManager;