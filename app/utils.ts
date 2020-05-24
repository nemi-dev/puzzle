function quantize(pos : number, parentSize : number, offset : number, divideBy : number, flip : boolean) {
	let n = Math.floor((pos - offset) / (parentSize / divideBy));
	if (flip) n = divideBy - n - 1;
	return n;
}

export function getRowCol(x : number, y : number, parentSize : number, left : number, top : number, divideBy : number, flipH : boolean, flipV : boolean) : [number, number] {
	return [
		quantize(y, parentSize, top, divideBy, flipV),
		quantize(x, parentSize, left, divideBy, flipH)
	]
}
