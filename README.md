# Tiny Image Magnifier

A simple and tiny image magnifier component for web applications with zero dependencies.

Example: https://oyo.github.io/tiny.image.magnifier/

![Example](./img/example.png)

### Get started

The simplest way to use this library
 - add class name "magnify" to your image or canvas
 - import the library (after images have been added to the DOM)

``` html
  <body>
    <img class="magnify" src="image.png" />
    <script type="module" src="https://oyo.github.io/tiny.image.magnifier/lib.js"></script>
  </body>
```

See https://oyo.github.io/tiny.image.magnifier/simple.html

### Customize

Use the import statement to customize default settings or if images are added dynamically.

``` html
  <script type="module">
    import { setLens, magnify } from 'https://oyo.github.io/tiny.image.magnifier/lib.js'
    setLens({
      radius: 100,
      light: 140,
      zoom: 4,
      distortFactor: -0.004
    })
    const img = new Image()
    img.setAttribute("crossOrigin", "anonymous")
    img.src = 'image.jpeg'
    document.body.appendChild(img)
    magnify(img)
  </script>
```

See https://oyo.github.io/tiny.image.magnifier/custom.html

### Usage

Works with
* image
* canvas
* svg (not recommended, see below)

Features
* one image only
* minimal configuration
* adjustable zoom level
* adjustable lens size
* adjustable lens distortion effect
* adjustable lens light effect

### Caveats

Note that all images will be drawn to a canvas which converts them to a raster format.
SVG images will not scale smoothly after that process and are therefore not recommended.
For cross domain loaded images you need to set the `crossOrigin="anonymous"` attribute.

```html
<img class="magnify" crossOrigin="anonymous" src="https://another.domain/image" />
```