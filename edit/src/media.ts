/**
 * The photo slots the edit draws from.
 *
 * Every entry maps to a file in `public/media/`. To use your own photography,
 * overwrite the file with the same name — nothing else needs to change. Shoot
 * or crop portrait (9:16); anything else is centre-cropped to fill the frame.
 *
 * `focus` nudges which part of the image survives that crop, as a percentage
 * pair passed straight to object-position. Bump it when a subject sits high or
 * low in the source photo.
 */
export type Slot = {
  id: string;
  file: string;
  /** What this slot is meant to hold, shown on the placeholder card. */
  brief: string;
  focus?: [number, number];
};

export const SLOTS: Record<string, Slot> = {
  hero: { id: "hero", file: "media/shot-01.jpg", brief: "hero / wide", focus: [50, 50] },
  front: { id: "front", file: "media/shot-02.jpg", brief: "front, low angle", focus: [50, 55] },
  side: { id: "side", file: "media/shot-03.jpg", brief: "full side profile", focus: [50, 50] },
  wheel: { id: "wheel", file: "media/shot-04.jpg", brief: "wheel + arch", focus: [50, 55] },
  lamp: { id: "lamp", file: "media/shot-05.jpg", brief: "headlight", focus: [50, 45] },
  rear: { id: "rear", file: "media/shot-06.jpg", brief: "rear three-quarter", focus: [50, 50] },
  detail: { id: "detail", file: "media/shot-07.jpg", brief: "badge / grille", focus: [50, 50] },
  rolling: { id: "rolling", file: "media/shot-08.jpg", brief: "rolling shot", focus: [50, 50] },
  interior: { id: "interior", file: "media/shot-09.jpg", brief: "interior", focus: [50, 50] },
  exhaust: { id: "exhaust", file: "media/shot-10.jpg", brief: "exhaust / diffuser", focus: [50, 60] },
};
