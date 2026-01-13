const magnifyLens = {
	radius: 180,
	zoom: 6,
	light: 80,
	distort: true,
	distortFactor: 0.002
}

let lastEvent = null

const setLens = lens => {
	const l = getLens()
	Object.assign(l, lens)
	setRadius(l.radius)
}

const setLight = light => {
	if (light < 0 || light > 255)
		return
	const l = getLens()
	l.light = light
	for (let px = 0; px < l.glimg.length; px++) {
		let y = ~~(px / l.r2),
			x = px % l.r2,
			dx = 0.9 * l.r - x,
			dy = 0.7 * l.r - y
		l.glimg[px] = l.light - ~~(l.light * (dx * dx + dy * dy) / (l.r * l.r))
	}
}

const setRadius = radius => {
	if (radius < 10 || radius > 250)
		return
	const l = magnifyLens
	l.r = l.radius = radius
	l.r2 = radius << 1
	l.rq = radius * radius
	if (l.can) {
		l.can.width = l.r2
		l.can.height = l.r2
		l.img = l.ctx.createImageData(l.r2, l.r2)
		l.glimg = new Array(l.r2 * l.r2)
		setLight(l.light)
	}
}

const getContentBoundingRect = ele => {
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

const getLens = () => {
	const l = magnifyLens
	if (!l.can) {
		l.can = document.createElement('canvas')
		l.can.id = 'lens'
		l.can.style = `position:fixed;
display:none;
z-index:2;
cursor:none;`
		l.ctx = l.can.getContext('2d')
		setRadius(l.radius)
		l.can.onclick = e => {
			l.distort = !l.distort
			update()
		}
		l.can.onmousemove = update
		l.can.onmousewheel = scroll
		if (l.can.addEventListener)
			l.can.addEventListener('DOMMouseScroll', scroll, false)
		document.body.appendChild(l.can)
	}
	return l
}

const init = img => {
	const l = getLens()
	if (img instanceof HTMLImageElement) {
		const can = document.createElement('canvas')
		can.width = img.width
		can.height = img.height
		const ctx = can.getContext('2d', { willReadFrequently: true })
		if (img.parentElement) {
			img.parentElement.insertBefore(can, img)
			img.parentElement.removeChild(img)
		}
		ctx.drawImage(img, 0, 0)
		can.className = img.className
		can.setAttribute('style', img.getAttribute('style'))
		img = can
	}
	img.addEventListener('mousemove', update)
	return img
}

const scroll = e => {
	e.preventDefault()
	const delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)))
	const l = magnifyLens
	if (e.shiftKey)
		setRadius(l.radius + 5 * delta)
	else if (e.ctrlKey)
		setLight(l.light + 4 * delta)
	else if (e.altKey)
		l.distortFactor += delta / 10000.0
	else {
		l.zoom += delta / 4
		if (l.zoom < 1)
			l.zoom = 1
		else if (l.zoom > 80)
			l.zoom = 80
	}
	update(e)
}

const update = e => {
	if (!e) {
		e = lastEvent
		if (!e)
			return
	} else
		lastEvent = e
	const l = magnifyLens
	let can = l.above
	if (!can)
		l.above = can = e.target
	const ctx = can.getContext('2d')
	const b = getContentBoundingRect(can)
	if (e.clientX < b.left - 1 || e.clientY < b.top - 2 || e.clientX >= b.left + b.width - 1 || e.clientY >= b.top + b.height - 2) {
		l.can.style.display = 'none'
		l.above = null
		return
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
}

const magnify = image =>
	[...(Array.isArray(image) || image instanceof NodeList || image instanceof HTMLCollection) ? image : [image]]
		.forEach(img => {
			if (img instanceof SVGElement) {
				const svg = new Image()
				svg.src = `data:image/svg+xml;base64,${btoa(img.outerHTML)}`
				svg.classList.add(...img.classList)
				if (img.parentElement) {
					img.parentElement.insertBefore(svg, img)
					img.parentElement.removeChild(img)
				}
				img = svg
			}
			(m =>
				(img instanceof HTMLCanvasElement) || img.complete
					? m()
					: img.onload = m
			)(
				() => init(img)
			)
		})

window.addEventListener('load', () => magnify(document.getElementsByClassName('magnify')))

export { setLens, magnify }