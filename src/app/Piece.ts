import { getRowCol, quantize, floatEqual } from "./utils";
import Game from "./Game";

const uniformSpeed = 30;

export default class Piece {

	static willHit(a : Piece, b: Piece, direction : "h" | "v") {
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

	/** 퍼즐 조각의 번호 */
	tag : number;

	/** 퍼즐 조각에 실제로 표시될 번호 */
	label : string;

	/** 퍼즐 조각이 참조할 원본 이미지 */
	texture : CanvasImageSource;

	/** 퍼즐 조각이 참조할 원본 이미지의 위치 */
	sx : number;
	sy : number;
	srcSize : number;

	/** 퍼즐 조각의 한 변의 길이 */
	size : number;

	/** 퍼즐 상에서 퍼즐 조각의 완쪽 끝 위치 */
	x : number;

	/** 퍼즐 상에서 퍼즐 조각의 위쪽 끝 위치 */
	y : number;

	/** 퍼즐 조각의 이동 속도 (업데이트에 이용된다. 아님 말고.) */
	velX : number = 0;
	velY : number = 0;

	/** 퍼즐 조각이 혼자서 움직일 때 (마우스를 놓을 때) 퍼즐 조각이 이동하는 경로 */
	private _destX : number = null;
	private _destY : number = null;

	nearX () {
		let distX = this._destX - this.x;
		return ((Math.abs(distX) < uniformSpeed) || (Math.abs(distX) < Math.abs(this.velX)));
	}

	nearY () {
		let distY = this._destY - this.y;
		return ((Math.abs(distY) < uniformSpeed) || (Math.abs(distY) < Math.abs(this.velY)));
	}

	set destX(v : number) {
		this._destX = v;
		if (v != null) {
			if (this.nearX()) {
				this._destX = null;
				this.x = v;
				this.velX = 0;
			} else {
				this.velX = uniformSpeed * Math.sign(v - this.x);
			}
		}
	}

	set destY(v : number) {
		this._destY = v;
		if (v != null) {
			if (this.nearY()) {
				this._destY = null;
				this.y = v;
				this.velY = 0;
			} else {
				this.velY = uniformSpeed * Math.sign(v - this.y);
			}
		}
	}

	constructor(tag: number, texture: CanvasImageSource, srcX : number, srcY : number, srcD : number, viewD : number) {
		this.tag = tag;
		this.texture = texture;
		this.sx = srcX;
		this.sy = srcY;
		this.srcSize = srcD;
		this.size = viewD;
	}

	/**
	 * 퍼즐 조각의 현재 위치, 현재 속도를 기반으로 **목표 행렬 위치**를 찾아낸다.  
	 * 다른 말로 하면 아직 _destX, destY가 정해지지 않았단 뜻이다.
	 * */
	evaluatePosition(left : number, top : number, boardSize : number, divideBy : number) : [number, number] {
		let col : number;
		if (this.velX == 0) col = quantize(this.x + this.size / 2, boardSize, left, divideBy);
		else {
			col = quantize(this.x, boardSize, left, divideBy);
			if (floatEqual(left + col * this.size, this.x)) {
				// 조각이 칸에 딱 들어맞아 있는 경우, 그 칸의 왼쪽 또는 오른쪽으로 한다. (velX이 0이 아니기 때문)
				col += Math.sign(this.velX);
			} else {
				// 조각이 2개의 칸에 걸쳐 있다고 말할 수 있을 정도로 충분히 많이 튀어나온 경우, 2개의 조각 중에서 하나로 정한다.
				if (this.velX > 0) col += 1;
			}
			col = Math.max(0, Math.min(col, boardSize / divideBy - 1));
		}

		let row : number;
		if (this.velY == 0) row = quantize(this.y + this.size / 2, boardSize, top, divideBy);
		else {
			row = quantize(this.y, boardSize, top, divideBy);
			if (floatEqual(top + row * this.size, this.y)) {
				// 조각이 칸에 딱 들어맞아 있는 경우, 그 칸의 위 또는 아래로 한다. (velY가 0이 아니기 때문)
				row += Math.sign(this.velY);
			} else {
				// 조각이 2개의 칸에 걸쳐 있다고 말할 수 있을 정도로 충분히 많이 튀어나온 경우, 2개의 자리 중에서 하나로 정한다.
				if (this.velY > 0) row += 1;
			}
			row = Math.max(0, Math.min(row, boardSize / divideBy - 1));
		}

		return [row, col];
	}

	/** 퍼즐 조각의 현재 위치만을 기반으로 퍼즐의 행렬 위치를 찾아낸다. */
	whereami(left : number, top : number, boardSize : number, divideBy : number) : [number, number] {
		let x = this.x + this.size / 2;
		let y = this.y + this.size / 2;
		return getRowCol(x, y, boardSize, left, top, divideBy)
	}

	/** 
	 * 업데이트한다.  
	 * 빈칸을 나타내는 조각은 업데이트되지 않는다.
	 * 
	 * 일단, 업데이트 자체는 드래그 여부와 상관없이 모든 조각에 대해 항상 실행된다.
	*/
	update(game : Game) {

		// (참고 : 마우스 버튼을 누르는 순간 모든 조각의 _destX, destY가 null이 되고 velX, velY 또한 0이 되므로 조각을 드래그하는 중에는 이 블록과 저 아래에 _destY 블록까지 무시된다.)
		// 아직 목표 x위치에 도달하지 않았다면
		if (this._destX != null) {
			if (this.nearX()) {
				this.x = this._destX;
				this._destX = null;
				if (this.velX) game.createSpark(this.x, this.y, "h", - Math.sign(this.velX));
				this.velX = 0;
			}
		}

		if (this._destY != null) {
			if (this.nearY()) {
				this.y = this._destY;
				this._destY = null;
				if (this.velY) game.createSpark(this.x, this.y, "v", - Math.sign(this.velY));
				this.velY = 0;
			}
		}


		this.x += this.velX;
		this.y += this.velY;
		if (this.x < game.left) {
			this.x = game.left;
			this.velX = 0;
		} else if (this.x + this.size > game.right) {
			this.x = game.right - this.size;
			this.velX = 0;
		}
		if (this.y < game.top) {
			this.y = game.top;
			this.velY = 0;
		} else if (this.y + this.size > game.bottom) {
			this.y = game.bottom - this.size;
			this.velY = 0;
		}
		
	}

	/**
	 * 렌더링한다.  
	 * 빈칸을 나타내는 조각에 대해서는 메서드가 아예 실행되지 않는다.
	 */
	render(context: CanvasRenderingContext2D, showLabel = true) {
		context.fillStyle = 'white';
		context.lineWidth = 0.5;
		context.drawImage(this.texture, this.sx, this.sy, this.srcSize, this.srcSize, this.x, this.y, this.size, this.size);
		context.strokeRect(this.x, this.y, this.size, this.size);
		
		if (showLabel) {
			let fontSize = Math.floor(this.size/3);
			context.font = fontSize + 'px "Exo 2"';
			context.lineWidth = 5;

			let { width } = context.measureText(this.label);
			let x = this.x + width / 2 + 4;
			let y = this.y + this.size / 6 + 2;
			
			context.strokeText(this.label, x, y);
			context.fillText(this.label, x, y);
		}
	}

	/**
	 * 퍼즐 조각을 목표 위치로 즉시 이동시키고, 속도를 없앤다.
	 */
	getIntoPositionNow(game : Game) {
		if (this._destX != null) {
			this.x = this._destX;
			this._destX = null;
			if (this.velX) game.createSpark(this.x, this.y, "h", - Math.sign(this.velX));
			this.velX = 0;
		}
		if (this._destY != null) {
			this.y = this._destY;
			this._destY = null;
			if (this.velY) game.createSpark(this.x, this.y, "v", - Math.sign(this.velY));
			this.velY = 0;
		}
	}
	
}
