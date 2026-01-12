declare interface LensOptions {
  radius: number;
  zoom: number;
  light: number;
  distort: boolean;
  distortFactor: number;
}

declare function setLens(options: Partial<LensOptions>): void;
declare function magnify(image: HTMLImageElement | HTMLCanvasElement | SVGElement | NodeList | HTMLCollection): void;

export { setLens, magnify, LensOptions };
