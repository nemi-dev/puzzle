
/**
 * PuzzleSet은 그림, 정사각형 영역, 해결 가능 여부를 모아놓은 것이다.  
 * 
 * 행이나 열을 뒤집는 기능 따위는 없다. 
 */
export default class PuzzleSet {
	texture : CanvasImageSource
	srcX : number
	srcY : number
	dimension : number
	screw : boolean

	constructor (imagepath : string, srcX : number, srcY : number, dimension : number, screw : boolean) {
		this.texture = new Image()
		this.texture.src = imagepath
		this.srcX = srcX;
		this.srcY = srcY;
		this.dimension = dimension;
		this.screw = screw;
	}
	

	/**
	 * 행, 열 번호로 이미지에서 참조할 좌표를 찾는다.
	 * @param row 
	 * @param col 
	 * @param divideBy 
	 */
	getPosition(row : number, col : number, divideBy : number) : [number, number] {
		let d = this.dimension / divideBy;
		return [this.srcX + col * d, this.srcY + row * d]
	}

}