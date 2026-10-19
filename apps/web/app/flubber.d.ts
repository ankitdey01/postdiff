declare module "flubber" {
  export type Interpolator = (value: number) => string;
  export function combine(
    from: string[],
    to: string,
    options?: { maxSegmentLength?: number; single?: boolean },
  ): Interpolator;
  export function separate(
    from: string,
    to: string[],
    options?: { maxSegmentLength?: number; single?: boolean },
  ): Interpolator;
}
