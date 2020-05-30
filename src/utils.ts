function quantize(pos : number, parentSize : number, offset : number, divideBy : number) {
	let n = Math.floor((pos - offset) / (parentSize / divideBy));
	return n;
}

/**
 * 왼쪽 경계가 left, 오른쪽 경계가 top인 정사각형 parentSize를 정사각행렬 꼴로 divideBy만큼 나누었을 때, 좌표 (x, y)가 속한 행렬 위치
 */
export function getRowCol(x : number, y : number, parentSize : number, left : number, top : number, divideBy : number) : [number, number] {
	return [
		quantize(y, parentSize, top, divideBy),
		quantize(x, parentSize, left, divideBy)
	]
}

/**
 * 왼쪽 경계가 left, 오른쪽 경계가 top인 정사각형 parentSize를 정사각행렬 꼴로 divideBy만큼 나누었을 때, row행 col열에 있는 부분 정사각형의 왼쪽 위 좌표
 */
export function getPosition(row : number, col : number, parentSize : number, left : number, top : number, divideBy : number) : [number, number] {
	let d = parentSize / divideBy;
	return [left + col * d, top + row * d]
}
