export const randomUniqueString = (size = 32) => {
	const array = new Uint8Array(size);

	crypto.getRandomValues(array);

	return Array.from(array, b => b.toString(16).padStart(2, "0")).join("");
}

export const sliceText = (text: string, numsSlice: number = 4): string => {
	const parseText = text.toString();

	try {
		return parseText.length <= numsSlice ? parseText : parseText.slice(0, numsSlice) + "...";
	} catch (error: unknown) {
		console.warn("🚀 ~ sliceText ~ unknown:", error)

		return error instanceof Error  ? error.message : "error";
	}
};
