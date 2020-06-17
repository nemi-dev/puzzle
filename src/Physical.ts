/** 두 개의 박스 a, b에 대해 어떠한 축 위에서의 **1차원 충돌**을 예측한다. */
export function willHit(a : Physical, b : Physical, direction : "h" | "v") {
	if (a == b) return false;
	let aStart : number;
	let aEnd : number;
	let bStart : number;
	let bEnd : number;
	if (direction == "h") {
		aStart = Math.min(a.x, a.x + a.velX);
		aEnd = Math.max(a.x + a.size, a.x + a.size + a.velX);
		bStart = Math.min(b.x, b.x + b.velX);
		bEnd = Math.max(b.x + b.size, b.x + b.size + b.velX);
	} else if (direction == "v") {
		aStart = Math.min(a.y, a.y + a.velY);
		aEnd = Math.max(a.y + a.size, a.y + a.size + a.velY);
		bStart = Math.min(b.y, b.y + b.velY);
		bEnd = Math.max(b.y + b.size, b.y + b.size + b.velY);
	} else {
		return false;
	}
	return aStart < bEnd && bStart < aEnd;
}
