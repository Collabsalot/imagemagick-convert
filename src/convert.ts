import { spawn } from 'child_process'

const RESIZE_DEFAULT = 'crop'
const optionsDefaults = {
	srcData: null,
	srcFormat: null,
	width: null,
	height: null,
	resize: RESIZE_DEFAULT,
	density: 600,
	background: 'none',
	gravity: 'Center',
	format: null,
	quality: 75,
	blur: null,
	rotate: null,
	flip: false,
}
const attributesMap = new Set([
	'density',
	'background',
	'gravity',
	'quality',
	'blur',
	'rotate',
	'flip',
])

class Converter {
	options: Map<any, any>

	constructor (options: object = {}) {
		this.options = new Map(Object.entries({ ...optionsDefaults, ...options }))
	}

	proceed (): Promise<Buffer> {
		return new Promise((resolve, reject) => {
			const source = this.options.get('srcData')

			if (source && (source instanceof Buffer)) {
				try {
					const origin = this.createOccurrence(this.options.get('srcFormat'))
					const result = this.createOccurrence(this.options.get('format'))
					const cmd = this.composeCommand(origin, result)
					const cp = spawn('convert', cmd)
					const store: Uint8Array[] = []

					cp.stdout.on('data', (data) => store.push(Buffer.from(data)))
					cp.stdout.on('end', () => resolve(Buffer.concat(store)))

					cp.stderr.on('data', (data) => reject(data.toString()))
					cp.stdin.end(source)
				} catch (e) {
					reject(e)
				}
			} else reject(new Error('imagemagick-convert: the field `srcData` is required and should have `Buffer` type'))
		})
	}

	createOccurrence (format?: string, name?: string): string {
		const occurrence = []

		if (format) occurrence.push(format)
		occurrence.push(name || '-')

		return occurrence.join(':')
	}

	composeCommand (origin: string, result: string): string[] {
		const cmd = []
		const resize = this.resizeFactory()

		// add attributes
		for (const attribute of attributesMap) {
			const value = this.options.get(attribute)

			if (value || value === 0) cmd.push(typeof value === 'boolean' ? `-${attribute}` : `-${attribute} ${value}`)
		}

		// add resizing preset
		if (resize) cmd.push(resize)

		// add in and out
		cmd.push(origin)
		cmd.push(result)

		return cmd.join(' ').split(' ')
	}

	resizeFactory (): string {
		const resize = this.options.get('resize')
		const geometry = this.geometryFactory()

		const resizeMap = new Map([
			['fit', `-resize ${geometry}`],
			['fill', `-resize ${geometry}!`],
			['crop', `-resize ${geometry}^ -crop ${geometry}+0+0!`],
		])

		if (!resize || !geometry) {
			return ''
		}

		return resizeMap.get(resize) || resizeMap.get(RESIZE_DEFAULT) as string
	}

	geometryFactory (): string {
		const size = []
		const w = this.options.get('width')
		const h = this.options.get('height')

		size.push(w || w === 0 ? w : '')
		if (h || h === 0) size.push(h)

		return size.join('x')
	}
}

const convert = async (options?: object): Promise<Buffer> => {
	const converter = new Converter(options)

	return converter.proceed()
}

export { convert, Converter }
