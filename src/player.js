import * as THREE from 'three';

const mat = (color, roughness = .78) => new THREE.MeshStandardMaterial({ color, roughness });

export function createPlayer(scene) {
  const root = new THREE.Group();
  root.name = 'AisPlayer';
  scene.add(root);

  const body = new THREE.Group();
  root.add(body);
  const skin = mat('#f2c6aa');
  const hair = mat('#49313b');
  const dress = mat('#e8a6bf');
  const dressTop = mat('#f4c9d7');
  const shoe = mat('#705565');
  const white = mat('#fff9f0');
  const eyes = mat('#493342');
  const detail = mat('#d98ca9');

  function part(parent, geometry, material, position, scale) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(...position);
    if (scale) mesh.scale.set(...scale);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  // Dress and torso
  part(body, new THREE.CylinderGeometry(.31, .53, .95, 18), dress, [0, .91, 0]);
  part(body, new THREE.SphereGeometry(.34, 20, 16), dressTop, [0, 1.48, 0], [.88, .85, .68]);
  part(body, new THREE.SphereGeometry(.13, 14, 12), detail, [0, 1.08, .43], [1.1, .45, .35]);

  // Head and hair
  part(body, new THREE.SphereGeometry(.39, 24, 20), skin, [0, 2.02, .025], [1, 1.05, .9]);
  part(body, new THREE.SphereGeometry(.43, 22, 18), hair, [0, 2.2, -.055], [1.04, .98, .98]);
  part(body, new THREE.SphereGeometry(.27, 16, 12), hair, [0, 2.42, .24], [1.2, .52, .68]);
  for (const side of [-1, 1]) {
    part(body, new THREE.CapsuleGeometry(.115, .62, 4, 9), hair, [side * .39, 1.91, -.015], [1, 1, 1]);
    part(body, new THREE.SphereGeometry(.052, 10, 8), white, [side * .145, 2.05, .365]);
    part(body, new THREE.SphereGeometry(.027, 10, 8), eyes, [side * .145, 2.05, .405]);
    part(body, new THREE.SphereGeometry(.075, 10, 8), skin, [side * .37, 1.63, .02]);
  }
  part(body, new THREE.SphereGeometry(.105, 10, 8), detail, [.3, 2.48, .11], [1, .8, .65]);

  // Arms are placed outside the dress silhouette, with visible shoulders and hands.
  const arms = [];
  for (const side of [-1, 1]) {
    const arm = new THREE.Group();
    arm.position.set(side * .34, 1.48, .005);
    body.add(arm);
    part(arm, new THREE.CapsuleGeometry(.085, .43, 5, 10), skin, [side * .105, -.255, .015], [1, 1, 1]);
    part(arm, new THREE.SphereGeometry(.095, 12, 10), skin, [side * .14, -.52, .035]);
    arms.push({ group: arm, side });
  }

  // Two-part legs make the sitting pose visibly bent instead of floating.
  const legs = [];
  for (const side of [-1, 1]) {
    const upper = new THREE.Group();
    upper.position.set(side * .17, .53, .015);
    body.add(upper);
    part(upper, new THREE.CapsuleGeometry(.105, .34, 5, 10), skin, [0, -.2, 0]);
    const lower = new THREE.Group();
    lower.position.set(0, -.39, 0);
    upper.add(lower);
    part(lower, new THREE.CapsuleGeometry(.09, .34, 5, 10), skin, [0, -.18, .01]);
    part(lower, new THREE.SphereGeometry(.13, 12, 10), shoe, [0, -.39, .12], [1, .65, 1.35]);
    legs.push({ upper, lower });
  }

  return {
    root, body, arms, legs,
    update(dt, velocity, jumping, sitting = false) {
      const speed = Math.min(1, velocity.length() / 7);
      const t = performance.now() * .008;
      if (sitting) {
        body.position.y = THREE.MathUtils.damp(body.position.y, 0, 12, dt);
        body.rotation.x = THREE.MathUtils.damp(body.rotation.x, -.06, 10, dt);
        arms.forEach(({ group, side }) => {
          group.rotation.x = THREE.MathUtils.damp(group.rotation.x, -.55, 10, dt);
          group.rotation.z = THREE.MathUtils.damp(group.rotation.z, side * -.12, 10, dt);
        });
        legs.forEach(({ upper, lower }) => {
          upper.rotation.x = THREE.MathUtils.damp(upper.rotation.x, -1.15, 12, dt);
          lower.rotation.x = THREE.MathUtils.damp(lower.rotation.x, 1.35, 12, dt);
        });
        return;
      }
      body.rotation.x = THREE.MathUtils.damp(body.rotation.x, jumping ? -.12 : 0, 8, dt);
      body.position.y = THREE.MathUtils.damp(body.position.y, Math.sin(t * 2) * .025 * speed, 10, dt);
      arms.forEach(({ group, side }) => {
        group.rotation.x = THREE.MathUtils.damp(group.rotation.x, Math.sin(t + (side < 0 ? Math.PI : 0)) * .42 * speed, 12, dt);
        group.rotation.z = THREE.MathUtils.damp(group.rotation.z, side * -.06, 12, dt);
      });
      legs.forEach(({ upper, lower }, i) => {
        const swing = Math.sin(t + (i ? Math.PI : 0)) * .72 * speed;
        upper.rotation.x = THREE.MathUtils.damp(upper.rotation.x, swing, 12, dt);
        lower.rotation.x = THREE.MathUtils.damp(lower.rotation.x, Math.max(0, -swing) * .75, 12, dt);
      });
    }
  };
}
