import { getRowCol } from "./utils";
import Game from "./Game";
import Physical from "./Physical";

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

	/** 퍼즐 조각에 실제로 표시될 번호 */
	label : string;

	/** 퍼즐 조각이 참조할 원본 이미지 */
	texture : CanvasImageSource;

	/** 퍼즐 조각이 참조할 원본 이미지의 위치 */
	sx : number;
	sy : number;
	srcSize : number;

	// /** 퍼즐 조각의 한 변의 길이 */
	// size : number;

	// /** 퍼즐 상에서 퍼즐 조각의 완쪽 끝 위치 */
	// x : number;

	// /** 퍼즐 상에서 퍼즐 조각의 위쪽 끝 위치 */
	// y : number;

	// /** 퍼즐 조각의 이동 속도 (업데이트에 이용된다. 아님 말고.) */
	// velX : number = 0;
	// velY : number = 0;

	readonly phy = new Physical();
	/** 퍼즐 조각이 혼자서 움직일 때 (마우스를 놓을 때) 퍼즐 조각이 이동하는 경로 */
	destX : number = null;
	destY : number = null;

	constructor(tag: number, texture: CanvasImageSource, srcX : number, srcY : number, srcD : number, viewD : number) {
		this.tag = tag;
		this.texture = texture;
		this.sx = srcX;
		this.sy = srcY;
		this.srcSize = srcD;
		this.phy.size = viewD;
	}

	/** 퍼즐 조각의 목표 위치/현재 위치를 기반으로 퍼즐의 행렬 위치를 찾아낸다. */
	whereami(left : number, top : number, boardSize : number, divideBy : number) : [number, number] {
		let x = (this.destX != null? this.destX : this.phy.x) + this.phy.size / 2;
		let y = (this.destY != null? this.destY : this.phy.y) + this.phy.size / 2;
		return getRowCol(x, y, boardSize, left, top, divideBy)
	}

	/**
	 * 퍼즐 조각을 한 방향으로 움직이기만 한다.
	 * 위에 것과는 다르게 재귀를 사용하지 않는다.
	 */
	move(dist : number, direction : "h" | "v", game : Game, concern : Piece) {
		const { axis, start, end } = AXIS[direction];

	}

	/** 
	 * 업데이트한다.  
	 * 빈칸을 나타내는 조각은 업데이트되지 않는다.
	 * 
	 * 일단, 업데이트 자체는 드래그 여부와 상관없이 모든 조각에 대해 항상 실행된다.
	*/
	update(game : Game) {

		// (참고 : 마우스 버튼을 누르는 순간 모든 조각의 destX, destY가 null이 되고 velX, velY 또한 0이 되므로 조각을 드래그하는 중에는 이 블록과 저 아래에 destY 블록까지 무시된다.)
		// 아직 목표 x위치에 도달하지 않았다면
		if (this.destX != null) {
			let distX = this.destX - this.phy.x;

			// 목표 위치에 도달할 수 있도록 속도를 설정해준다.
			this.phy.velX = this.phy.size / 6 * Math.sign(distX);
			// 조각이 목표에 충분히 가까이 접근했다면 목표 위치에 안착시키고, 속도를 없앤다.
			if ((Math.abs(distX) < Math.abs(this.phy.velX)) || (Math.abs(distX) < 0.1)) {
				this.phy.x = this.destX;
				this.destX = null;
				if (Math.abs(this.phy.velX) >= 3) {
					// tick!
				}
				this.phy.velX = 0;
			}
		}
		if (this.destY != null) {
			let distY = this.destY - this.phy.y;
				this.phy.velY = this.phy.size / 6 * Math.sign(distY);
				if ((Math.abs(distY) < Math.abs(this.phy.velY)) || (Math.abs(distY) < 0.1)) {
				this.phy.y = this.destY;
				this.destY = null;
				if (Math.abs(this.phy.velY) >= 3) {
					// tick!
				}
				this.phy.velY = 0;
			}
		}


		this.phy.x += this.phy.velX;
		this.phy.y += this.phy.velY;
		if (this.phy.x < game.left) {
			this.phy.x = game.left;
			this.phy.velX = 0;
		} else if (this.phy.x + this.phy.size > game.right) {
			this.phy.x = game.right - this.phy.size;
			this.phy.velX = 0;
		}
		if (this.phy.y < game.top) {
			this.phy.y = game.top;
			this.phy.velY = 0;
		} else if (this.phy.y + this.phy.size > game.bottom) {
			this.phy.y = game.bottom - this.phy.size;
			this.phy.velY = 0;
		}
		
	}

	/**
	 * 렌더링한다.  
	 * 빈칸을 나타내는 조각에 대해서는 메서드가 아예 실행되지 않는다.
	 */
	render(context: CanvasRenderingContext2D, showLabel = true) {
		context.fillStyle = 'white';
		context.lineWidth = 1;
		context.strokeRect(this.phy.x, this.phy.y, this.phy.size, this.phy.size);
		context.fillRect(this.phy.x, this.phy.y, this.phy.size, this.phy.size);
		context.drawImage(this.texture, this.sx, this.sy, this.srcSize, this.srcSize, this.phy.x, this.phy.y, this.phy.size, this.phy.size);
		
		if (showLabel) {
			let fontSize = Math.floor(this.phy.size/3);
			context.font = fontSize + 'px "Exo 2"';
			context.lineWidth = 3;

			let { width } = context.measureText(this.label);
			let x = this.phy.x + width / 2 + 4;
			let y = this.phy.y + this.phy.size / 6 + 2;
			
			context.strokeText(this.label, x, y);
			context.fillText(this.label, x, y);
		}
	}

	/**
	 * 퍼즐 조각을 목표 위치로 즉시 이동시키고, 속도를 없앤다.
	 */
	getIntoPositionNow() {
		if (this.destX != null) {
			this.phy.x = this.destX;
			this.destX = null;
			this.phy.velX = 0;
		}
		if (this.destY != null) {
			this.phy.y = this.destY;
			this.destY = null;
			this.phy.velY = 0;
		}
	}
	
	/** x에서 x + velX로 또는 y에서 y + velY로 이동하는 경로에 부딪힐 다른 조각들이 있는지 판단한다. */
	willHit(concern : Piece[], direction : "h" | "v") : Piece[] {
		let vector : Piece[] = [];

		if (direction == "h") {
			for (const piece of concern) {
				// if (piece.physical.x + piece.physical.size )
			}
		} else if (direction == "v") {

		}
		

		return vector;
	}	

}
