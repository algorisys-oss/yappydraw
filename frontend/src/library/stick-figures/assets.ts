/**
 * The full stick-figure catalog, assembled from three sources:
 *   • POSES  → character variants (male / female / boy / girl) via `buildFigure`
 *   • PROPS  → standalone objects (laptop, phone, chart, box…)
 *   • SCENES → multi-figure bundles (handshake, team, family…)
 *
 * Base poses are authored once (neutral geometry); the variant matrix is generated,
 * so adding a pose yields up to four figures for free. See ./builder.ts for the
 * variant generator and ./poses.ts for the source poses.
 */
import { buildFigure, VARIANTS, W, H, type Variant } from './builder';
import { POSES } from './poses';
import { PROP_ASSETS } from './props';
import { SCENE_ASSETS } from './scenes';
import type { StickAsset } from './types';

const VARIANT_LABEL: Record<Variant, string> = {
    male: 'Male', female: 'Female', boy: 'Boy', girl: 'Girl',
};

/** Expand the base poses into the male/female/boy/girl variant matrix. */
function buildVariantAssets(): StickAsset[] {
    const out: StickAsset[] = [];
    for (const pose of POSES) {
        const variants: Variant[] = pose.variants === false ? ['male'] : VARIANTS;
        for (const v of variants) {
            out.push({
                // Male keeps the base id (stable API); other variants suffix it.
                id: v === 'male' ? pose.id : `${pose.id}-${v}`,
                name: v === 'male' ? pose.name : `${pose.name} (${VARIANT_LABEL[v]})`,
                category: pose.category as StickAsset['category'],
                tags: v === 'male' ? pose.tags : [...pose.tags, v, VARIANT_LABEL[v].toLowerCase()],
                variant: v,
                svg: buildFigure(pose, v),
                w: W, h: H,
            });
        }
    }
    return out;
}

/** The full catalog: figure variants + props + scenes. */
export const STICK_ASSETS: StickAsset[] = [
    ...buildVariantAssets(),
    ...PROP_ASSETS,
    ...SCENE_ASSETS,
];
