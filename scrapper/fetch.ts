import * as fs from "node:fs";

/**
 * fetch with fs cache
 */
export const fetch = async (uri: string | URL, o?: RequestInit) => {
	const path = CACHE_DIR + uri.toString().replaceAll("/", "_");

	if (!fs.existsSync(path)) {
		const { arrayBuffer, headers } = await acquireLockAndExecute(async () => {
			console.log("fetching", uri.toString());

			const res = await globalThis.fetch(uri, o);
			if (!res.ok)
				throw new Error(
					await res.text().catch(() => res.statusText ?? res.status),
				);

			return {
				headers: res.headers.toJSON(),
				arrayBuffer: await res.arrayBuffer(),
			};
		});

		const jsonBlock = new TextEncoder().encode(
			JSON.stringify({ headers }, null, 2),
		);

		const content = new Uint8Array([
			...new Uint8Array(new Uint16Array([jsonBlock.length]).buffer),
			...jsonBlock,
			...new Uint8Array(arrayBuffer),
		]);

		fs.mkdirSync(CACHE_DIR, { recursive: true });
		fs.writeFileSync(path, content);
	}

	const content = fs.readFileSync(path);
	const jsonBlockLength = new Uint16Array(content.buffer, 0, 1)[0];

	const jsonBlock = new Uint8Array(content.buffer, 2, jsonBlockLength);
	const json = JSON.parse(new TextDecoder().decode(jsonBlock));
	const buffer = Buffer.from(
		new Uint8Array(content.buffer, 2 + jsonBlockLength),
	);

	return {
		ok: true,
		json: async () => JSON.parse(buffer.toString()),
		text: async () => buffer.toString(),
		arrayBuffer: async () => buffer.buffer as ArrayBuffer,
		headers: new Headers(json.headers),
	} satisfies Pick<
		Response,
		"ok" | "headers" | "text" | "json" | "arrayBuffer"
	>;
};

const wait = (d = 0) => new Promise((r) => setTimeout(r, d));

let lock: Promise<unknown> | null = null;
const acquireLockAndExecute = async <T>(h: () => Promise<T>): Promise<T> => {
	while (lock) await lock;
	const promise = h();
	lock = promise.finally(async () => {
		await wait(DELAY_BETWEEN_REQUEST);
		lock = null;
	});
	return promise;
};

export const invalidateCache = (uri: string | URL) => {
	const path = CACHE_DIR + uri.toString().replaceAll("/", "_");

	try {
		fs.rmSync(path);
	} catch (err) {}
};

const DELAY_BETWEEN_REQUEST = 5_000; //ms

const CACHE_DIR = __dirname + "/../.cache/http-request/";
