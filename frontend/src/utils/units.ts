/**
 * Measurement units (Precision & Measurement — units setting).
 *
 * All on-canvas measurement is in world pixels; this converts/formats them into the
 * user's chosen unit (px / mm / in) so every readout — transform HUD, Measure tool,
 * dimension annotations, gap measuring — shares one representation. Pure, no store.
 *
 * Conversion assumes CSS reference density: 96 px = 1 in, 25.4 mm = 1 in.
 */

export type MeasurementUnit = 'px' | 'mm' | 'in';

const PX_PER_IN = 96;
const MM_PER_IN = 25.4;

/** Linear world-px → the given unit's scalar value (no suffix, no rounding). */
export function pxToUnit(px: number, unit: MeasurementUnit): number {
    if (unit === 'mm') return (px / PX_PER_IN) * MM_PER_IN;
    if (unit === 'in') return px / PX_PER_IN;
    return px;
}

/** Decimals conventionally shown per unit (px is whole, mm 1dp, in 2dp). */
export function unitDecimals(unit: MeasurementUnit): number {
    return unit === 'px' ? 0 : unit === 'mm' ? 1 : 2;
}

/** Number-only, converted + rounded to the unit's convention (no suffix). */
export function formatValue(px: number, unit: MeasurementUnit): string {
    const v = pxToUnit(px, unit);
    const d = unitDecimals(unit);
    return d === 0 ? String(Math.round(v)) : v.toFixed(d);
}

/** A length with its unit suffix, e.g. "120 px", "31.8 mm", "1.25 in". */
export function formatLength(px: number, unit: MeasurementUnit = 'px'): string {
    return `${formatValue(px, unit)} ${unit}`;
}

/** An area (given in px²) converted to the unit's square, with suffix. */
export function formatArea(pxArea: number, unit: MeasurementUnit = 'px'): string {
    const f = pxToUnit(1, unit);          // linear factor
    const a = pxArea * f * f;             // area scales by the square
    const d = unitDecimals(unit);
    const n = d === 0 ? String(Math.round(a)) : a.toFixed(d);
    return `${n} ${unit}²`;
}
