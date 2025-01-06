export async function sleep(timeout: number) {
	await new Promise<void>((resolve, _reject) => {
		setTimeout(() => {
			resolve();
		}, timeout);
	});
}
