/**
 * PuzzleSet은 그림, 정사각형 영역, 해결 가능 여부를 모아놓은 것이다.  
 * 행이나 열을 뒤집는 기능 따위는 없다. 
 */
export default class PuzzleSet {
	title : string
	img : string
	story : string
	left : number
	top : number
	size : number
	solvable : boolean
	texture : HTMLImageElement

	/**
	 * 행, 열 번호로 이미지에서 참조할 좌표를 찾는다.
	 */
	getPosition(row : number, col : number, divideBy : number) : [number, number] {
		let d = this.size / divideBy;
		return [this.left + col * d, this.top + row * d]
	}

	waitForImageLoad() : Promise<void> {
		this.texture = new Image();
		this.texture.src = '/img/' + this.img
		if (this.texture.complete) {
			return Promise.resolve();
		}
		return new Promise((a, b) => {
			this.texture.onload = ev => {
				a();
			}
			this.texture.onerror = b;
		})
	}

}