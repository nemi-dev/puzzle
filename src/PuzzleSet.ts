
/**
 * PuzzleSet은 그림, 정사각형 영역, 해결 가능 여부를 모아놓은 것이다.  
 * 
 * 행이나 열을 뒤집는 기능 따위는 없다. 
 */
export default class PuzzleSet {
	texture : HTMLImageElement
	srcX : number
	srcY : number
	srcLength : number
	solvable : boolean
	story : string

	constructor (imagepath : string, srcX : number, srcY : number, dimension : number, solvable : boolean, story : string) {
		this.texture = new Image()
		this.texture.src = '/img/' + imagepath
		this.srcX = srcX;
		this.srcY = srcY;
		this.srcLength = dimension;
		this.solvable = solvable;
		this.story = story;
	}
	

	/**
	 * 행, 열 번호로 이미지에서 참조할 좌표를 찾는다.
	 */
	getPosition(row : number, col : number, divideBy : number) : [number, number] {
		let d = this.srcLength / divideBy;
		return [this.srcX + col * d, this.srcY + row * d]
	}

	waitForImageLoad() : Promise<void> {
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