# Raka: Fractured Reality

A 2.5D dark fantasy Metroidvania Soulslike set inside **Castle Virel**, featuring three distinct weapons, reality-bending powers, directional weapon combos, unique weapon projectiles, and a 4-branch Skill Tree.

## Weapons & Combat

- **Riftblade (Energy Sword)**: Combo chain with Rift Crescents, `W + J` Skybreaker launcher, `Air S + J` Plunge, `[F]` **Rift Lance**, and `[R]` **Rift Surge**.
- **Twin Voidfangs (Dual Daggers)**: 5-hit flurry, `Dodge → J` Ambush lunge, `W + J` Rising Spin, `[F]` **Voidfang Kunai** (marks enemies for +35% melee damage), and `[R]` **Mirage Anchor**.
- **Cataclysm (Gravity Greatsword)**: High armor & poise, `Block → J` Guard Counter, `Air S + J` Meteor Dive, `[F]` **Gravity Orb**, and `[R]` **Singularity Crush**.

## Controls

- **Move / Climb Ladders**: `A / D` · `W / S`
- **Jump / Drop Through**: `Space` · `S + Space`
- **Attack / Parry / Dodge**: `J` (LMB) · `K` (RMB) · `L` (Shift)
- **Reality Powers**: `1` Phase Shift · `2` Spatial Sever · `3` Chrono-Fracture
- **Weapon Projectile / Art**: `F` · `R` (`4`)
- **Swap Weapon / Skill Tree / Castle Map**: `Tab` · `T` · `M`
- **Interact / Execute / Flask**: `E` · `Q`

## Local Development

```bash
npm install
npm run dev
```

## Production Build

```bash
npm run lint
npm run build
```

## Deploying to GitHub Pages

1. Push this repository to GitHub (`main` branch).
2. In your GitHub repository, open **Settings → Pages**.
3. Under **Build and deployment → Source**, choose **GitHub Actions**.
4. The workflow in `.github/workflows/deploy.yml` will automatically typecheck, build `dist/` with relative asset paths (`base: './'`), and publish the game.
