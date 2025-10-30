export function isValidHexColor(hex: string): boolean {
	return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$/.test(hex);
}

export function ensureHexColor(color: string | undefined, defaultColor: string = "#6366F1"): string {
	if (!color) {
		return defaultColor;
	}

	// If it's already a valid hex color, return as-is
	if (isValidHexColor(color)) {
		return color;
	}

	// If it's a named color or invalid format, return default
	return defaultColor;
}

export const DEFAULT_HEX_COLORS = [
	"#EF4444", // red
	"#F97316", // orange
	"#FBBF24", // amber
	"#FCD34D", // yellow
	"#BFEF45", // lime
	"#22C55E", // green
	"#10B981", // emerald
	"#14B8A6", // teal
	"#06B6D4", // cyan
	"#0EA5E9", // sky
	"#3B82F6", // blue
	"#6366F1", // indigo
	"#8B5CF6", // violet
	"#A855F7", // purple
	"#D946EF", // fuchsia
	"#EC4899", // pink
	"#F43F5E", // rose
	"#64748B", // slate
	"#6B7280", // gray
	"#71717A", // zinc
	"#737373", // neutral
	"#78716C", // stone
];

export function getRandomHexColor(): string {
	return DEFAULT_HEX_COLORS[Math.floor(Math.random() * DEFAULT_HEX_COLORS.length)];
}

export function hexToRgb(hex: string): string {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

	if (!result) {
		return "rgb(99, 102, 241)"; // Default to indigo
	}

	const r = parseInt(result[1], 16);
	const g = parseInt(result[2], 16);
	const b = parseInt(result[3], 16);

	return `rgb(${r}, ${g}, ${b})`;
}

export function rgbToHex(r: number, g: number, b: number): string {
	return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
}
