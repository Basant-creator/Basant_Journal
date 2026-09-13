"use client";

import { useMemo } from "react";
import { Shape } from "three";
import { CHAIR, TENT, TENT_TURN } from "./layout";
import { camp } from "./palette";

/**
 * The tent.
 *
 * An A-frame, because a dome is a different century. A triangle extruded along
 * its length — three shapes in total once the opening and the guy line are
 * counted, which is as cheap as a tent gets and reads correctly from the only
 * angle anyone will see it from.
 *
 * The opening is the point. A closed tent is a shape; a tent with a dark gap
 * in it is somewhere someone sleeps, and the difference costs one triangle.
 * It faces the fire, because that is where a tent's mouth goes.
 */
function Tent() {
  const profile = useMemo(() => {
    const s = new Shape();
    s.moveTo(-1.12, 0);
    s.lineTo(0, 1.58);
    s.lineTo(1.12, 0);
    s.closePath();
    return s;
  }, []);

  const mouth = useMemo(() => {
    const s = new Shape();
    s.moveTo(-0.46, 0);
    s.lineTo(0, 1.02);
    s.lineTo(0.46, 0);
    s.closePath();
    return s;
  }, []);

  return (
    <group position={TENT} rotation={[0, TENT_TURN, 0]}>
      <mesh position={[0, 0, -1.35]}>
        <extrudeGeometry args={[profile, { depth: 2.7, bevelEnabled: false }]} />
        <meshStandardMaterial color={camp.canvas} roughness={0.95} metalness={0} />
      </mesh>

      {/* The way in, set a hair proud of the canvas so it cannot z-fight. */}
      <mesh position={[0, 0, 1.36]}>
        <shapeGeometry args={[mouth]} />
        <meshStandardMaterial color={camp.canvasShade} roughness={1} />
      </mesh>

      {/* One guy line and its peg. A tent with nothing holding it down is a
          prop; this is the detail that says someone put it up. */}
      <mesh position={[1.5, 0.42, 1.5]} rotation={[0, 0, -0.72]}>
        <cylinderGeometry args={[0.012, 0.012, 1.5, 4]} />
        <meshStandardMaterial color={camp.timber} roughness={1} />
      </mesh>
    </group>
  );
}

/**
 * Something to sit on.
 *
 * A folding camp stool: a seat and two crossed frames. Low, small, and turned
 * a little away from square — a chair squared to the fire looks placed, and a
 * chair at an angle looks sat in and left.
 */
function Stool() {
  return (
    <group position={CHAIR} rotation={[0, -0.5, 0]}>
      <mesh position={[0, 0.44, 0]}>
        <boxGeometry args={[0.46, 0.05, 0.4]} />
        <meshStandardMaterial color={camp.canvasShade} roughness={1} />
      </mesh>

      {[-0.34, 0.34].map((lean, i) => (
        <mesh key={i} position={[0, 0.22, 0]} rotation={[0, 0, lean]}>
          <boxGeometry args={[0.035, 0.52, 0.035]} />
          <meshStandardMaterial color={camp.timberDark} roughness={1} />
        </mesh>
      ))}

      {[-0.18, 0.18].map((z, i) => (
        <mesh key={`side-${i}`} position={[0, 0.22, z]} rotation={[0, 0, 0.34]}>
          <boxGeometry args={[0.03, 0.5, 0.03]} />
          <meshStandardMaterial color={camp.timberDark} roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

export function CampSite() {
  return (
    <>
      <Tent />
      <Stool />
    </>
  );
}
