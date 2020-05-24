import { getRowCol } from "./utils";
import Game from "./Game";

const AXIS = {
	h : {
		axis : 'x',
		start : 'left',
		end : 'right'
	},
	v : {
		axis : 'y',
		start : 'top',
		end : 'bottom'
	}
}

export default class Piece {
	/** 퍼즐 조각의 번호 */
	tag : number;

	/** 퍼즐 조각이 참조할 원본 이미지 */
	texture : CanvasImageSource;

	/** 퍼즐 조각이 참조할 원본 이미지의 위치 */
	sx : number;
	sy : number;
	srcSize : number;

	/** 퍼즐 상에서 퍼즐 조각의 위치와 한 변의 길이 */
	x : number;
	y : number;
	size : number;

	/** 퍼즐 조각이 혼자서 움직일 때 (마우스를 놓을 때) 퍼즐 조각이 이동하는 경로 */
	destX : number = null;
	destY : number = null;

	/** 퍼즐 조각의 이동 속도 (업데이트에 이용된다. 아님 말고.) */
	velX : number = 0;
	velY : number = 0;

	constructor(tag: number, texture: CanvasImageSource, srcX : number, srcY : number, srcD : number, viewD : number) {
		this.tag = tag;
		this.texture = texture;
		this.sx = srcX;
		this.sy = srcY;
		this.srcSize = srcD;
		this.size = viewD;
	}

	/** 퍼즐 조각의 목표 위치/현재 위치를 기반으로 퍼즐의 행렬 위치를 찾아낸다. */
	whereami(left : number, top : number, boardSize : number, divideBy : number, flipH : boolean, flipV : boolean) : [number, number] {
		let x = (this.destX != null? this.destX : this.x) + this.size / 2;
		let y = (this.destY != null? this.destY : this.y) + this.size / 2;
		return getRowCol(x, y, boardSize, left, top, divideBy, flipH, flipV)
	}

	/** 퍼즐 조각을 한 방향으로 움직인다. (대각선 이동은 구현에 좀 더 정교한 기하학을 필요로 한다.) 다른 퍼즐 조각과 부딪히는 경우 그것도 함께 밀어낸다. 이것은 **한 업데이트 사이클에서 모두 일어난다!** */
	push(dist : number, direction : "h" | "v", game : Game, concern : Piece[]) {
		const { axis, start, end } = AXIS[direction];
		let backpress : number = null;
		let est = this[axis] + dist;

		if (est < game[start]) {
			backpress = est - game[start];
			est = game[start];
		} else if (est + this.size > game[end]) {
			backpress = est + this.size - game[end];
			est = game[end] - this.size;
		}

		this[axis] = est;

		if (backpress) return backpress;

		for (const piece of concern) {
			if (Piece.hitTest(this, piece)) {
				let dist_ = (this.size  * Math.sign(dist) + this[axis] - piece[axis]);
				backpress = piece.push(dist_, direction, game, concern);
				if (backpress != null) {
					this[axis] -= backpress;
					return backpress;
				}
			}
		}

		return backpress;
	}

	/** 업데이트한다. */
	update(game : Game) {

		if (this.destX != null) {
			if (Math.abs(this.destX - this.x) < 0.1) {
				this.x = this.destX;
				this.destX = null;
				if (Math.abs(this.velX) > this.size / 12) {
					// Tick!
				}
				this.velX = 0;
			}
			this.velX = this.size / 12 * Math.sign(this.destX - this.x);
		}
		if (this.destY != null) {
			if (Math.abs(this.destY - this.y) < 0.1) {
				this.y = this.destY;
				this.destY = null;
				if (Math.abs(this.velY) > this.size / 12) {
					// Tick!
				}
				this.velY = 0;
			}
			this.velY = this.size / 12 * Math.sign(this.destY - this.y);
		}


		this.x += this.velX;
		this.y += this.velY;
		if (this.x < game.left) {
			this.x = game.left;
		} else if (this.x + this.size > game.right) {
			this.x = game.right - this.size;
		}
		if (this.y < game.top) {
			this.y = game.top;
		} else if (this.y + this.size > game.bottom) {
			this.y = game.bottom - this.size;
		}
		
	}

	render(context: CanvasRenderingContext2D) {
		if (this.tag != 0) {
			context.fillStyle = 'white';
			context.lineWidth = 1;
			context.fillRect(this.x, this.y, this.size, this.size);
			context.drawImage(this.texture, this.sx, this.sy, this.srcSize, this.srcSize, this.x, this.y, this.size, this.size);
			context.strokeRect(this.x, this.y, this.size, this.size);
			
			context.font = '36px "Exo 2"';
			context.lineWidth = 3;
			context.strokeText((this.tag + 1).toString(), this.x + 4, this.y + this.size - 4);
			context.fillText((this.tag + 1).toString(), this.x + 4, this.y + this.size - 4);
		}
	}

	
	
	

	static hitTest(a : Piece, b : Piece) : boolean {
		if (a == b || a.tag == 0 || b.tag == 0) return false;
		let leftA = a.x;
		let rightA = a.x + a.size;
		let topA = a.y;
		let bottomA = a.y + a.size;
		
		let leftB = b.x;
		let rightB = b.x + b.size;
		let topB = b.y;
		let bottomB = b.y + b.size;

		// console.log(leftA < rightB, leftB < rightA, topA < bottomB, bottomA > topB)
		return leftA < rightB && leftB < rightA && topA < bottomB && topB < bottomA;
		
	}
}
