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

/** Physical의 속성을 가지고 있는 어떤 객체에서 Physical의 속성만을 뽑아내 복사한다. */
export function clone(src : Physical) : Physical {
	let { x, y, size, velX, velY } = src;
	return { x, y, size, velX, velY }
}

/** target의 각 Physical 속성이 src의 것과 같게 한다. */
export function assign(target : Physical, src : Physical) {
	target.x = src.x;
	target.y = src.y;
	// 아직까진 모든 조각의 크기가 같으므로 생략한다.
	// target.size = src.size
	target.velX = src.velX;
	target.velY = src.velY;
}

declare global {
	interface Window {
		willHit : (a : Physical, b : Physical, direction : "h" | "v") => boolean
	}
}

window.willHit = willHit;
