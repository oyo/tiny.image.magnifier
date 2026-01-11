export default class Magnify {

	static lens = {
		radius: 180,
		zoom: 6,
		light: 80,
		distort: true,
		distortFactor: 0.002
	}

	static setDefault(lens) {
		Magnify.lens = Object.assign(Magnify.lens, lens);
		[...document.getElementsByClassName('magnify')].forEach(img => img.magnify.update())
	}

	constructor(image, lens) {
		this.lens = Object.assign(Magnify.lens, lens)
		if (image)
			this.init(image)
		this.lastEvent = null
	}

	getLens() {
		if (!this.lens.can) {
			const l = this.lens
			l.can = document.createElement('canvas')
			l.can.id = 'lens'
			l.can.style = `position:fixed;
display:none;
z-index:2;
cursor:none;`
			l.ctx = l.can.getContext('2d')
			this.setRadius(l.radius)
			l.can.onclick = function (e) {
				l.distort = !l.distort
				this.update()
			}.bind(this)
			l.can.onmousemove = this.update.bind(this)
			l.can.onmousewheel = this.modify.bind(this)
			if (l.can.addEventListener)
				l.can.addEventListener('DOMMouseScroll', this.modify.bind(this), false)
		}
		return this.lens
	}

	init(img) {
		this.getLens()
		if (img instanceof HTMLImageElement) {
			const can = document.createElement('canvas')
			can.width = img.width
			can.height = img.height
			img.parentElement.insertBefore(can, img)
			img.parentElement.removeChild(img)
			const ctx = can.getContext('2d', { willReadFrequently: true })
			ctx.drawImage(img, 0, 0)
			can.className = img.className
			img = can
			if (this.lens.can.parentElement)
				this.lens.can.parentElement.removeChild(this.lens.can)
		}
		img.magnify = this;
		img.parentElement.appendChild(this.lens.can)
		img.addEventListener('mousemove', this.update.bind(this))
		return this.lens.can
	}

	setRadius(lr) {
		if (lr < 10 || lr > 250)
			return this
		const l = this.lens
		l.r = l.radius = lr
		l.r2 = lr << 1
		l.rq = lr * lr
		l.can.width = l.r2
		l.can.height = l.r2
		l.img = l.ctx.createImageData(l.r2, l.r2)
		l.glimg = new Array(l.r2 * l.r2)
		this.setLight(l.light)
		return this
	}

	setLight(light) {
		if (light < 0 || light > 255)
			return this
		const l = this.lens
		l.light = light
		for (let px = 0; px < l.glimg.length; px++) {
			let y = ~~(px / l.r2),
				x = px % l.r2,
				dx = 0.9 * l.r - x,
				dy = 0.7 * l.r - y
			l.glimg[px] = l.light - ~~(l.light * (dx * dx + dy * dy) / (l.r * l.r))
		}
		return this
	}

	modify(e) {
		e.preventDefault()
		const delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)))
		const l = this.lens
		if (e.shiftKey)
			this.setRadius(l.radius + 5 * delta)
		else if (e.ctrlKey)
			this.setLight(l.light + 4 * delta)
		else if (e.altKey)
			this.lens.distortFactor += delta / 10000.0
		else {
			l.zoom += delta / 4
			if (l.zoom < 1)
				l.zoom = 1
			else if (l.zoom > 80)
				l.zoom = 80
		}
		return this.update(e)
	}

	getContentBoundingRect(ele) {
		const st = window.getComputedStyle(ele)
		const b = ele.getBoundingClientRect()
		const borderLeft = parseFloat(st.borderLeftWidth) || 0
		const borderTop = parseFloat(st.borderTopWidth) || 0
		const paddingLeft = parseFloat(st.paddingLeft) || 0
		const paddingTop = parseFloat(st.paddingTop) || 0
		return {
			left: b.left + borderLeft + paddingLeft,
			top: b.top + borderTop + paddingTop,
			width: ele.width,
			height: ele.height
		}
	}

	update(e) {
		if (!e) {
			e = this.lastEvent
			if (!e)
				return this
		} else
			this.lastEvent = e
		const l = this.lens
		let can = l.above
		if (!can)
			this.lens.above = can = e.target
		const ctx = can.getContext('2d')
		const b = this.getContentBoundingRect(can)
		if (e.clientX < b.left - 1 || e.clientY < b.top - 2 || e.clientX >= b.left + b.width - 1 || e.clientY >= b.top + b.height - 2) {
			this.lens.can.style.display = 'none'
			this.lens.above = null
			return this
		}
		const mx = Math.round(e.clientX - b.left + 1)
		const my = Math.round(e.clientY - b.top + 1)
		if (mx < can.clientWidth && my < can.clientHeight && mx >= 0 && my >= 0) {
			let df, sr = ~~(l.r / l.zoom)
			if (l.distort) {
				df = l.distortFactor / l.r
				sr *= 2
			} else {
				df = 0
				sr += 2
			}
			try {
				const img = ctx.getImageData(mx - sr, my - sr, 2 * sr, 2 * sr)
				for (let y = 0; y < l.r2; y++) {
					const dy = y - l.r
					const dyq = dy * dy
					for (let x = 0; x < l.r2; x++) {
						let dx = x - l.r,
							dxq = dx * dx,
							rd = Math.sqrt(dxq + dyq),
							ru = rd * (1 - df * rd * rd),
							rf = rd / ru,
							xs = Math.round((dx * rf) / l.zoom) + sr,
							ys = Math.round((dy * rf) / l.zoom) + sr,
							ti = (l.r2 * y + x) * 4,
							si = (2 * sr * ys + xs) * 4
						if (xs > 0 && ys > 0 && xs < 2 * sr && ys < 2 * sr)
							for (let i = 0; i < 4; i++)
								l.img.data[ti + i] = img.data[si + i] + (l.light ? l.glimg[~~(ti / 4)] : 0)
						else
							for (let i = 0; i < 4; i++)
								l.img.data[ti + i] = 128
						l.img.data[(l.r2 * y + x) * 4 + 3] = dxq + dyq < l.rq ? 255 : 0
					}
				}
				l.ctx.putImageData(l.img, 0, 0)
				l.can.style.display = 'block'
				l.can.style.opacity = 1
				l.can.style.left = (e.clientX - l.r) + 'px'
				l.can.style.top = (e.clientY - l.r) + 'px'
			} catch (e) {
				console.log(e)
			}
		} else {
			l.can.style.display = 'none'
			l.above = null
		}
		return this
	}
}

[...document.getElementsByClassName('magnify')].forEach(img => {
	const init = () => new Magnify(img);
	(img instanceof HTMLCanvasElement) || img.complete ? init() : img.onload = init
})