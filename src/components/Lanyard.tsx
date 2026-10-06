import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Canvas,
  extend,
  useFrame,
  type ThreeElement,
  type ThreeEvent,
} from "@react-three/fiber";
import {
  Environment,
  Lightformer,
  useGLTF,
  useTexture,
} from "@react-three/drei";
import {
  BallCollider,
  CuboidCollider,
  Physics,
  RigidBody,
  useRopeJoint,
  useSphericalJoint,
  type RapierRigidBody,
  type RigidBodyProps,
} from "@react-three/rapier";
import { MeshLineGeometry, MeshLineMaterial } from "meshline";
import * as THREE from "three";
import cardModel from "@/assets/lanyard/card.glb";
import lanyardTexture from "@/assets/lanyard/lanyard.png";
import "./Lanyard.css";

extend({ MeshLineGeometry, MeshLineMaterial });

declare module "@react-three/fiber" {
  interface ThreeElements {
    meshLineGeometry: ThreeElement<typeof MeshLineGeometry>;
    meshLineMaterial: ThreeElement<typeof MeshLineMaterial>;
  }
}

const BLANK_PIXEL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";
const FRONT_UV_RECT = { x: 0, y: 0, w: 0.5, h: 0.755 };
const BACK_UV_RECT = { x: 0.5, y: 0, w: 0.5, h: 0.757 };
const MAX_RENDER_PIXELS = 3_000_000;
const MIN_RENDER_DPR = 0.6;
const MAX_PULL_DISTANCE = {
  x: 1.75,
  y: 0.75,
  z: 0.3,
};

function getRenderDpr(isMobile: boolean) {
  if (typeof window === "undefined") return 1;

  const viewportPixels = Math.max(
    1,
    window.innerWidth * window.innerHeight,
  );
  const pixelBudgetDpr = Math.sqrt(
    MAX_RENDER_PIXELS / viewportPixels,
  );

  return Math.min(
    window.devicePixelRatio || 1,
    isMobile ? 1.5 : 2,
    Math.max(MIN_RENDER_DPR, pixelBudgetDpr),
  );
}

type LanyardProps = {
  position?: [number, number, number];
  gravity?: [number, number, number];
  fov?: number;
  transparent?: boolean;
  frontImage?: string | null;
  backImage?: string | null;
  imageFit?: "cover" | "contain";
  lanyardImage?: string | null;
  lanyardWidth?: number;
  lanyardRepeat?: [number, number];
  paused?: boolean;
};

export default function Lanyard({
  position = [0, 0, 30],
  gravity = [0, -40, 0],
  fov = 20,
  transparent = true,
  frontImage = null,
  backImage = null,
  imageFit = "cover",
  lanyardImage = null,
  lanyardWidth = 1,
  lanyardRepeat = [-4, 1],
  paused = false,
}: LanyardProps) {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth < 768,
  );
  const [renderDpr, setRenderDpr] = useState(() =>
    getRenderDpr(
      typeof window !== "undefined" && window.innerWidth < 768,
    ),
  );

  useEffect(() => {
    const handleResize = () => {
      const nextIsMobile = window.innerWidth < 768;
      setIsMobile(nextIsMobile);
      setRenderDpr(getRenderDpr(nextIsMobile));
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="lanyard-wrapper">
      <Canvas
        camera={{ position, fov }}
        dpr={renderDpr}
        frameloop={paused ? "never" : "always"}
        gl={{
          alpha: transparent,
          antialias: false,
          powerPreference: "high-performance",
        }}
        onCreated={({ gl }) =>
          gl.setClearColor(
            new THREE.Color(0x000000),
            transparent ? 0 : 1,
          )
        }
      >
        <ambientLight intensity={Math.PI} />
        <Physics
          gravity={gravity}
          timeStep={isMobile ? 1 / 30 : 1 / 60}
        >
          <Band
            isMobile={isMobile}
            frontImage={frontImage}
            backImage={backImage}
            imageFit={imageFit}
            lanyardImage={lanyardImage}
            lanyardWidth={lanyardWidth}
            lanyardRepeat={lanyardRepeat}
          />
        </Physics>
        <Environment blur={0.75}>
          <Lightformer
            intensity={2}
            color="white"
            position={[0, -1, 5]}
            rotation={[0, 0, Math.PI / 3]}
            scale={[100, 0.1, 1]}
          />
          <Lightformer
            intensity={3}
            color="white"
            position={[-1, -1, 1]}
            rotation={[0, 0, Math.PI / 3]}
            scale={[100, 0.1, 1]}
          />
          <Lightformer
            intensity={3}
            color="white"
            position={[1, 1, 1]}
            rotation={[0, 0, Math.PI / 3]}
            scale={[100, 0.1, 1]}
          />
          <Lightformer
            intensity={10}
            color="white"
            position={[-10, 0, 14]}
            rotation={[0, Math.PI / 2, Math.PI / 3]}
            scale={[100, 10, 1]}
          />
        </Environment>
      </Canvas>
    </div>
  );
}

type BandProps = {
  maxSpeed?: number;
  minSpeed?: number;
  isMobile?: boolean;
  frontImage?: string | null;
  backImage?: string | null;
  imageFit?: "cover" | "contain";
  lanyardImage?: string | null;
  lanyardWidth?: number;
  lanyardRepeat?: [number, number];
};

type LanyardRigidBody = RapierRigidBody & {
  lerped?: THREE.Vector3;
};

function Band({
  maxSpeed = 50,
  minSpeed = 0,
  isMobile = false,
  frontImage = null,
  backImage = null,
  imageFit = "cover",
  lanyardImage = null,
  lanyardWidth = 1,
  lanyardRepeat = [-4, 1],
}: BandProps) {
  const band = useRef<
    THREE.Mesh<
      InstanceType<typeof MeshLineGeometry>,
      InstanceType<typeof MeshLineMaterial>
    >
  >(null);
  const fixed = useRef<RapierRigidBody>(null!);
  const joint1 = useRef<LanyardRigidBody>(null!);
  const joint2 = useRef<LanyardRigidBody>(null!);
  const joint3 = useRef<RapierRigidBody>(null!);
  const card = useRef<RapierRigidBody>(null!);
  const vector = new THREE.Vector3();
  const angularVelocity = new THREE.Vector3();
  const rotation = new THREE.Vector3();
  const direction = new THREE.Vector3();
  const dragOffset = useRef(new THREE.Vector3());
  const dragOrigin = useRef(new THREE.Vector3());
  const segmentProps: RigidBodyProps = {
    type: "dynamic",
    canSleep: true,
    colliders: false,
    angularDamping: 4,
    linearDamping: 4,
  };

  const getLerped = (body: LanyardRigidBody) => {
    if (!body.lerped) {
      body.lerped = new THREE.Vector3().copy(body.translation());
    }
    return body.lerped;
  };

  const { nodes, materials } = useGLTF(cardModel) as any;
  const texture = useTexture(lanyardImage || lanyardTexture);
  const frontTexture = useTexture(frontImage || BLANK_PIXEL);
  const backTexture = useTexture(backImage || BLANK_PIXEL);

  const cardMap = useMemo(() => {
    const baseMap = materials.base.map as THREE.Texture;
    if (!frontImage && !backImage) return baseMap;

    const baseImage = baseMap.image as HTMLImageElement;
    const width = baseImage.width;
    const height = baseImage.height;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return baseMap;
    context.drawImage(baseImage, 0, 0, width, height);

    const drawFitted = (
      image: CanvasImageSource & { width: number; height: number },
      rectangle: typeof FRONT_UV_RECT,
    ) => {
      const rectangleX = rectangle.x * width;
      const rectangleY = rectangle.y * height;
      const rectangleWidth = rectangle.w * width;
      const rectangleHeight = rectangle.h * height;
      const pick =
        imageFit === "contain" ? Math.min : Math.max;
      const scale = pick(
        rectangleWidth / image.width,
        rectangleHeight / image.height,
      );
      const drawWidth = image.width * scale;
      const drawHeight = image.height * scale;
      const drawX =
        rectangleX + (rectangleWidth - drawWidth) / 2;
      const drawY =
        rectangleY + (rectangleHeight - drawHeight) / 2;
      context.save();
      context.beginPath();
      context.rect(
        rectangleX,
        rectangleY,
        rectangleWidth,
        rectangleHeight,
      );
      context.clip();
      context.drawImage(
        image,
        drawX,
        drawY,
        drawWidth,
        drawHeight,
      );
      context.restore();
    };

    if (frontImage && frontTexture.image) {
      drawFitted(
        frontTexture.image as HTMLImageElement,
        FRONT_UV_RECT,
      );
    }
    if (backImage && backTexture.image) {
      drawFitted(
        backTexture.image as HTMLImageElement,
        BACK_UV_RECT,
      );
    }

    const composite = new THREE.CanvasTexture(canvas);
    composite.colorSpace = THREE.SRGBColorSpace;
    composite.flipY = baseMap.flipY;
    composite.anisotropy = 16;
    composite.needsUpdate = true;
    return composite;
  }, [
    backImage,
    backTexture,
    frontImage,
    frontTexture,
    imageFit,
    materials.base.map,
  ]);

  const [curve] = useState(
    () =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(),
        new THREE.Vector3(),
        new THREE.Vector3(),
        new THREE.Vector3(),
      ]),
  );
  const [dragged, setDragged] = useState(false);
  const [hovered, setHovered] = useState(false);

  useRopeJoint(fixed, joint1, [
    [0, 0, 0],
    [0, 0, 0],
    1,
  ]);
  useRopeJoint(joint1, joint2, [
    [0, 0, 0],
    [0, 0, 0],
    1,
  ]);
  useRopeJoint(joint2, joint3, [
    [0, 0, 0],
    [0, 0, 0],
    1,
  ]);
  useSphericalJoint(joint3, card, [
    [0, 0, 0],
    [0, 1.45, 0],
  ]);

  useEffect(() => {
    if (!hovered) return undefined;
    document.body.style.cursor = dragged ? "grabbing" : "grab";
    return () => {
      document.body.style.cursor = "auto";
    };
  }, [dragged, hovered]);

  useFrame((state, delta) => {
    const frameDelta = Math.min(delta, 1 / 30);
    if (dragged) {
      vector
        .set(state.pointer.x, state.pointer.y, 0.5)
        .unproject(state.camera);
      direction
        .copy(vector)
        .sub(state.camera.position)
        .normalize();
      vector.add(
        direction.multiplyScalar(state.camera.position.length()),
      );
      direction.copy(vector).sub(dragOffset.current);
      direction.x =
        dragOrigin.current.x +
        THREE.MathUtils.clamp(
          direction.x - dragOrigin.current.x,
          -MAX_PULL_DISTANCE.x,
          MAX_PULL_DISTANCE.x,
        );
      direction.y =
        dragOrigin.current.y +
        THREE.MathUtils.clamp(
          direction.y - dragOrigin.current.y,
          -MAX_PULL_DISTANCE.y,
          MAX_PULL_DISTANCE.y,
        );
      direction.z =
        dragOrigin.current.z +
        THREE.MathUtils.clamp(
          direction.z - dragOrigin.current.z,
          -MAX_PULL_DISTANCE.z,
          MAX_PULL_DISTANCE.z,
        );
      [
        card,
        joint1,
        joint2,
        joint3,
        fixed,
      ].forEach((reference) => reference.current?.wakeUp());
      card.current?.setNextKinematicTranslation(direction);
    }

    if (!fixed.current) return;
    [joint1, joint2].forEach((reference) => {
      const body = reference.current;
      if (!body) return;
      const lerped = getLerped(body);
      const clampedDistance = Math.max(
        0.1,
        Math.min(
          1,
          lerped.distanceTo(body.translation()),
        ),
      );
      lerped.lerp(
        body.translation(),
        frameDelta *
          (minSpeed +
            clampedDistance * (maxSpeed - minSpeed)),
      );
    });

    if (!joint3.current || !card.current || !band.current) return;
    curve.points[0].copy(joint3.current.translation());
    curve.points[1].copy(getLerped(joint2.current));
    curve.points[2].copy(getLerped(joint1.current));
    curve.points[3].copy(fixed.current.translation());
    band.current.geometry.setPoints(
      curve.getPoints(isMobile ? 16 : 32),
    );
    angularVelocity.copy(card.current.angvel());
    rotation.copy(card.current.rotation());
    card.current.setAngvel(
      {
        x: angularVelocity.x,
        y: angularVelocity.y - rotation.y * 0.25,
        z: angularVelocity.z,
      },
      true,
    );
  });

  curve.curveType = "chordal";
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

  return (
    <>
      <group position={[0, 4, 0]}>
        <mesh position={[0, 0, 0.035]}>
          <torusGeometry args={[0.105, 0.035, 16, 40]} />
          <meshStandardMaterial
            color="#F5F5F7"
            metalness={0.72}
            roughness={0.22}
          />
        </mesh>
        <RigidBody
          ref={fixed}
          {...segmentProps}
          type="fixed"
        />
        <RigidBody
          position={[0.5, 0, 0]}
          ref={joint1}
          {...segmentProps}
          type="dynamic"
        >
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody
          position={[1, 0, 0]}
          ref={joint2}
          {...segmentProps}
          type="dynamic"
        >
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody
          position={[1.5, 0, 0]}
          ref={joint3}
          {...segmentProps}
          type="dynamic"
        >
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody
          position={[2, 0, 0]}
          ref={card}
          {...segmentProps}
          type={dragged ? "kinematicPosition" : "dynamic"}
        >
          <CuboidCollider args={[0.8, 1.125, 0.01]} />
          <group
            scale={2.25}
            position={[0, -1.2, -0.05]}
            onPointerOver={() => setHovered(true)}
            onPointerOut={() => setHovered(false)}
            onPointerUp={(event: ThreeEvent<PointerEvent>) => {
              (event.target as Element).releasePointerCapture(
                event.pointerId,
              );
              setDragged(false);
            }}
            onPointerDown={(event: ThreeEvent<PointerEvent>) => {
              const cardPosition = card.current?.translation();
              if (cardPosition) {
                dragOrigin.current.set(
                  cardPosition.x,
                  cardPosition.y,
                  cardPosition.z,
                );
                dragOffset.current
                  .copy(event.point)
                  .sub(dragOrigin.current);
              }
              (event.target as Element).setPointerCapture(
                event.pointerId,
              );
              setDragged(true);
            }}
          >
            <mesh geometry={nodes.card.geometry}>
              <meshPhysicalMaterial
                map={cardMap}
                map-anisotropy={16}
                clearcoat={isMobile ? 0 : 1}
                clearcoatRoughness={0.15}
                roughness={0.9}
                metalness={0.8}
              />
            </mesh>
            <mesh
              geometry={nodes.clip.geometry}
              material={materials.metal}
              material-roughness={0.3}
            />
            <mesh
              geometry={nodes.clamp.geometry}
              material={materials.metal}
            />
          </group>
        </RigidBody>
      </group>
      <mesh ref={band}>
        <meshLineGeometry />
        <meshLineMaterial
          args={[
            {
              resolution: new THREE.Vector2(1000, 1000),
              lineWidth: lanyardWidth,
            },
          ]}
          color="white"
          depthTest={false}
          resolution={
            isMobile ? [1000, 2000] : [1000, 1000]
          }
          useMap={1}
          map={texture}
          repeat={lanyardRepeat}
          lineWidth={lanyardWidth}
        />
      </mesh>
    </>
  );
}
