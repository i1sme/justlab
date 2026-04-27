// Определение возможностей рендера для adaptive quality preset.
// CLAUDE.md: 'low' (2D-only или 3D с минимумом), 'medium', 'high'.
// На этом этапе MVP отличаем только supportsWebGL2 и грубую оценку GPU.

export type RenderQuality = 'low' | 'medium' | 'high';

interface CachedDetection {
	webgl2: boolean;
	quality: RenderQuality;
	rendererInfo: string;
}

let cached: CachedDetection | null = null;

/** Поддерживает ли среда WebGL2 (без него падаем в 2D). */
export function supportsWebGL2(): boolean {
	if (typeof document === 'undefined') return false;
	if (cached) return cached.webgl2;
	return detect().webgl2;
}

/** Грубая категоризация устройства по UNMASKED_RENDERER_WEBGL. */
export function detectQuality(): RenderQuality {
	if (typeof document === 'undefined') return 'medium';
	if (cached) return cached.quality;
	return detect().quality;
}

/** Сырое имя рендерера (для отладки/логов). */
export function rendererInfo(): string {
	if (typeof document === 'undefined') return '';
	if (cached) return cached.rendererInfo;
	return detect().rendererInfo;
}

function detect(): CachedDetection {
	const canvas = document.createElement('canvas');
	const gl = (canvas.getContext('webgl2') ?? canvas.getContext('webgl')) as
		| WebGL2RenderingContext
		| WebGLRenderingContext
		| null;

	if (!gl) {
		cached = { webgl2: false, quality: 'low', rendererInfo: '' };
		return cached;
	}

	const isWebGL2 =
		typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext;

	let info = '';
	const ext = gl.getExtension('WEBGL_debug_renderer_info');
	if (ext) {
		try {
			info = String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) ?? '');
		} catch {
			info = '';
		}
	}

	let quality: RenderQuality = 'medium';
	if (!isWebGL2) {
		quality = 'low';
	} else if (/SwiftShader|llvmpipe/i.test(info)) {
		// Программный рендер — точно low.
		quality = 'low';
	} else if (
		/Mali-(?:[45]\d\d|G(?:31|51|52))|Adreno \(?[34]\d\d\)?|PowerVR (?:SGX|GE)/i.test(info)
	) {
		// Старые/слабые мобильные GPU.
		quality = 'low';
	} else if (/Apple|Adreno \(?[678]\d\d\)?|Mali-G(?:7\d|78)|RTX|Radeon RX/i.test(info)) {
		quality = 'high';
	}

	cached = { webgl2: isWebGL2, quality, rendererInfo: info };
	return cached;
}
