declare interface LensOptions {
  radius: number;
  zoom: number;
  light: number;
  distort: boolean;
  distortFactor: number;
}

declare MagnifyType = HTMLImageElement | HTMLCanvasElement | SVGElement;

declare function setLens(options: Partial<LensOptions>): void;
declare function magnify(image: MagnifyType | Array<MagnifyType> | HTMLCollection | NodeList): void;

export { setLens, magnify, type MagnifyType, type LensOptions };
