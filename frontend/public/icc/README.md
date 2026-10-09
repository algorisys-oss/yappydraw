# CMYK press profiles

Used by the CMYK / PDF/X export (`frontend/src/utils/color-management.ts`): RGB→CMYK conversion,
the on-screen print preview, and the `DestOutputProfile` embedded in PDF/X files.

| File | Characterisation | Source | License |
|---|---|---|---|
| `fogra39-coated.icc` | FOGRA39 — ISO 12647-2 coated paper (Europe) | colord `data/profiles/FOGRA39L_coated.icc` (colord 1.4.7) | CC0-1.0, © 2012 Richard Hughes |
| `gracol-tr006-coated.icc` | CGATS TR 006 — GRACoL coated (US) | colord `data/profiles/GRACoL_TR006_coated.icc` (colord 1.4.7) | CC0-1.0, © 2012 Richard Hughes; characterisation data © 2007 NPES |

GRACoL attribution required by the NPES terms: *the characterisation data for
`gracol-tr006-coated.icc` is from CGATS Technical Report 006 (CGATS TR 006).* NPES: "Profiles, or
other derivative work, based on these data may be distributed with no further permissions from
CGATS. However, this Technical Report must be identified as the source of the characterization
data."

Not used, because they can't be redistributed without permission: the ECI (`ISOcoated_v2_eci`),
Adobe (`CoatedFOGRA39`) and IDEAlliance (`GRACoL2006_Coated1v2`) originals. See
`docs/cmyk-print-plan.md`.

sha256:
- `fogra39-coated.icc` 3ff7ca2a650ad47a8d2a929eb23ef162ccf979d013ade56e441c1f55156a261f
- `gracol-tr006-coated.icc` 6c5ad2c4536cb1e0ff9f61ae4c090ff0034c3886d12783ca628bf4d13dcac860
