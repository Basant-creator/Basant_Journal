"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { DoubleSide, type Mesh, type MeshStandardMaterial, type PointLight } from "three";
import { LANTERN, TABLE, TABLE_SIZE, TABLE_TOP } from "./layout";
import { useTimberTexture } from "./CampTimber";
import { camp, fire, props } from "./palette";

/**
 * The table, the lantern, and the things nobody is meant to click.
 *
 * §13 asks for a table that feels naturally cluttered and says plainly what
 * that rules out: objects arranged like a UI menu. The four a visitor can
 * actually pick up are placed in layout.ts on staggered positions, but
 * staggering alone does not make clutter — what makes a table read as used is
 * the things on it that do nothing. A mug someone set down and a pencil that
 * rolled are worth more here than a fifth interactive object, and §22 caps
 * interaction at four precisely so this layer can exist.
 */

/**
 * The lantern. §21: decorative, and the brief is blunt about why — not every
 * object needs to be a button.
 *
 * It earns its place by lighting. The fire is back and to the left, so
 * everything on the table would be lit from behind and read as silhouettes;
 * the lantern sits on the far corner and throws the objects' edges toward the
 * camera. That second source is what makes the table legible at all.
 *
 * Its flicker is slower and shallower than the fire's. A flame in a glass box
 * is sheltered — if it guttered like the open fire it would look like the same
 * light twice.
 */
function Lantern() {
  const glow = useRef<PointLight | null>(null);
  const wick = useRef<Mesh | null>(null);
  const glass = useRef<MeshStandardMaterial | null>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    /* One flicker, read by three things. The light, the flame and the glass
       all move together because they are the same event — a lantern whose
       light brightens while its flame does not is two objects. */
    const flare = 1 + Math.sin(t * 1.6) * 0.074 + Math.sin(t * 3.7) * 0.037;

    if (glow.current) glow.current.intensity = 1.35 * flare;
    if (wick.current) wick.current.scale.set(1, 0.9 + flare * 0.14, 1);
    if (glass.current) glass.current.emissiveIntensity = 0.5 * flare;
  });

  return (
    <group position={LANTERN}>
      {/* Base and cap. Brass that has been carried: rough enough not to
          mirror, metallic enough to go warm where the fire reaches it and
          dark where it does not. */}
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.075, 0.085, 0.04, 10]} />
        <meshStandardMaterial color={props.brass} roughness={0.52} metalness={0.55} />
      </mesh>
      <mesh position={[0, 0.235, 0]}>
        <cylinderGeometry args={[0.085, 0.06, 0.05, 10]} />
        <meshStandardMaterial color={props.brass} roughness={0.52} metalness={0.55} />
      </mesh>

      {/*
        The uprights.

        This is the difference between a lantern and a jar, and it costs three
        thin boxes. A glass cylinder between two brass discs is a preserve;
        the same thing with bars running up the outside of the glass is a
        lamp somebody carries. The silhouette does all of the work — at four
        metres the bars are two pixels and they are still the reason the
        object has a name.
      */}
      {[0, 1, 2].map((i) => {
        const a = (i / 3) * Math.PI * 2 + 0.4;
        return (
          <mesh
            key={i}
            position={[Math.cos(a) * 0.062, 0.13, Math.sin(a) * 0.062]}
            rotation={[0, -a, 0]}
          >
            <boxGeometry args={[0.008, 0.17, 0.006]} />
            <meshStandardMaterial color={props.brass} roughness={0.56} metalness={0.55} />
          </mesh>
        );
      })}

      {/*
        The flame, and then the glass in front of it.

        The glass used to be a solid emissive cylinder — the whole chimney
        lit from within at a constant value, which is a tube of light rather
        than a lamp. A lantern is a small bright thing inside a dull
        transparent thing, and the reason that reads is that the two are
        different sizes: the flame is a fraction of the chimney, so most of
        the glass is dark and the eye finds the bright part on its own.
      */}
      <mesh ref={wick} position={[0, 0.105, 0]}>
        <coneGeometry args={[0.014, 0.05, 6]} />
        <meshBasicMaterial color={fire.core} fog={false} />
      </mesh>

      <mesh position={[0, 0.13, 0]}>
        <cylinderGeometry args={[0.058, 0.058, 0.17, 12, 1, true]} />
        {/*
          Transparent, double-sided, and not writing depth: a chimney has a
          near wall and a far wall, and both of them have to be in front of
          the flame from somewhere. Faintly emissive on its own because glass
          beside a flame carries some of it — but a fraction of what the
          flame has, or the chimney goes back to being a tube of light.
        */}
        <meshStandardMaterial
          ref={glass}
          color={props.glass}
          emissive={props.glass}
          emissiveIntensity={0.5}
          roughness={0.18}
          metalness={0}
          transparent
          opacity={0.34}
          depthWrite={false}
          side={DoubleSide}
        />
      </mesh>

      {/* The handle, which is most of what says "lantern" rather than "jar". */}
      <mesh position={[0, 0.3, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.05, 0.006, 4, 10, Math.PI]} />
        <meshStandardMaterial color={props.brass} roughness={0.62} metalness={0.5} />
      </mesh>

      <pointLight ref={glow} position={[0, 0.12, 0]} intensity={1.35} distance={3.4} decay={2} color={fire.core} />
    </group>
  );
}
/** A tin mug, set down and forgotten. Nothing happens if you look at it. */
function Mug() {
  return (
    <group position={[TABLE[0] - 0.74, TABLE_TOP, TABLE[2] + 0.3]} rotation={[0, 0.6, 0]}>
      <mesh position={[0, 0.045, 0]}>
        <cylinderGeometry args={[0.045, 0.04, 0.09, 10]} />
        <meshStandardMaterial color={props.tin} roughness={0.6} metalness={0.35} />
      </mesh>
      <mesh position={[0.052, 0.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.026, 0.005, 4, 8]} />
        <meshStandardMaterial color={props.tin} roughness={0.6} metalness={0.35} />
      </mesh>
    </group>
  );
}

/** A pencil that rolled until something stopped it. */
function Pencil() {
  return (
    <mesh
      position={[TABLE[0] - 0.18, TABLE_TOP + 0.006, TABLE[2] - 0.34]}
      rotation={[0, 0.42, Math.PI / 2]}
    >
      <cylinderGeometry args={[0.007, 0.007, 0.17, 6]} />
      <meshStandardMaterial color={props.ink} roughness={0.9} />
    </mesh>
  );
}

export function CampTable() {
  const [w, d] = TABLE_SIZE;
  /* One tile across the whole top. The texture is square and the table is
     nearly twice as wide as it is deep, so the grain stretches along the
     boards — which is where grain goes. */
  const timber = useTimberTexture(1, 1);
  const leg = useTimberTexture(1, 3);

  /* The legs, as two trestles rather than four posts. A trestle is what a
     table like this is: two A-frames and something spanning them. Four
     separate splayed sticks read as a stool that grew. */
  const trestleX = [-(w / 2 - 0.26), w / 2 - 0.26];
  const legH = TABLE_TOP - 0.05;

  return (
    <group>
      {/* The top. A slab with a little thickness — a plane would have no edge
          to catch the lantern, and the edge is what gives it weight. */}
      <mesh position={[TABLE[0], TABLE_TOP - 0.025, TABLE[2]]}>
        <boxGeometry args={[w, 0.05, d]} />
        <meshStandardMaterial
          map={timber ?? undefined}
          color={timber ? undefined : camp.timber}
          roughness={0.92}
          metalness={0}
        />
      </mesh>

      {trestleX.map((tx, i) => (
        <group key={`trestle-${i}`} position={[TABLE[0] + tx, 0, TABLE[2]]}>
          {/* Two splayed legs meeting under the top. */}
          {[-1, 1].map((sz) => (
            <mesh
              key={sz}
              position={[0, legH / 2, sz * (d / 2 - 0.16)]}
              rotation={[-sz * 0.15, 0, 0]}
            >
              <boxGeometry args={[0.058, legH, 0.05]} />
              <meshStandardMaterial
                map={leg ?? undefined}
                color={leg ? undefined : camp.timberDark}
                roughness={1}
                metalness={0}
              />
            </mesh>
          ))}

          {/* The crossbar that makes the pair a trestle. */}
          <mesh position={[0, legH * 0.42, 0]}>
            <boxGeometry args={[0.04, 0.04, d - 0.22]} />
            <meshStandardMaterial color={camp.timberDark} roughness={1} metalness={0} />
          </mesh>
        </group>
      ))}

      {/* And the stretcher spanning the two trestles, low down, which is the
          piece that stops the whole thing reading as two separate objects
          standing near each other. */}
      <mesh position={[TABLE[0], legH * 0.3, TABLE[2]]}>
        <boxGeometry args={[w - 0.56, 0.038, 0.038]} />
        <meshStandardMaterial color={camp.timberDark} roughness={1} metalness={0} />
      </mesh>

      <Lantern />
      <Mug />
      <Pencil />
    </group>
  );
}
