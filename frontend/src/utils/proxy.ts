export function buildProxyURL(imagePath: string, size: number) {
	return `/proxy/insecure/rs:fill:${size}:${size}/plain${imagePath}@webp`;
}
