import Piece from "./Piece";
import Game from "./Game";
import { getPosition } from "./utils";
import MouseInput from "./Input";
import { willHit, clone, assign } from "./Physical";

const maximumTapDistance = 31

declare type ModelChange = {[i : number] : number};

/** 현재 누른 퍼즐 조각과 그 주변 조각에 대한 정보를 가지고 있다. */
export default class Grab {

	/** 현재 누른 퍼즐 조각 */
	piece: Piece = null;

	/** 현재 누른 퍼즐 조각의 원래 행렬 위치 */
	row: number = null;
	col: number = null;

	/** 마우스 버튼이 눌리는 그 순간에 현재 퍼즐 조각의 왼쪽 끝에 상대적인 마우스 위치 */
	private pieceOffsetX : number = null;
	private pieceOffsetY :number = null;

	/**
	 * 현재 누른 퍼즐 조각과 같은 행 또는 열에 있는 조각들의 모음이다.
	 * 충돌 테스트는 여기 있는 조각들에 한해서 실행된다.
	 */
	concern: Piece[] = null;

	/**
	 * 현재 누른 퍼즐 조각을 어느 방향으로 움직일 수 있는지 나타낸다.
	 * 이 값이 'h'이면 퍼즐 조각을 좌우좌로 움직일 수 있고, 퍼즐 중에서 행(row)이 선택된 것이다.
	 * 'v'이면 퍼즐 조각을 세로로 움직일 수 있고, 열(col)이 선택된 것이다.
	 */
	moveAxis: "v" | "h" | null = null;

	/** (rAF-sync) 마우스를 누를 때 실행된다. */
	onMousedown(m: MouseInputMessage, game: Game) {
		// 여기서는 [blankRow, blankCol] != [row, col]이다. 만약 둘이 같다면 이것은 실행조차 되지 않는다.
		let { startX: x, startY: y } = m;
		let [blankRow, blankCol] = game.rowColOfBlank;
		let [row, col] = game.getRowColAt(x, y);
		if (blankRow == row) {
			this.moveAxis = "h";
			this.concern = game.getVector(blankRow, "row");
		}
		else if (blankCol == col) {
			this.moveAxis = "v";
			this.concern = game.getVector(blankCol, "col");
		}
		this.row = row;
		this.col = col;
		this.piece = game.getPieceAt(row, col);
		this.pieceOffsetX = x - this.piece.x;
		this.pieceOffsetY = y - this.piece.y;
	}

	/** (rAF-sync) 마우스를 놓을 때 실행된다. */
	onMouseup(m: MouseInputMessage, game: Game) {
		let { startX, startY, endX, endY, startTime, endTime } = m;
		let distance = this.moveAxis == 'h'? endX - startX : endY - startY;
		/**
		 * # 탭인지 아닌지 판단하는 기준
		 * 
		 * 다음 모두를 만족할 것:
		 * - 누르기 시간이 특정 수치를 넘지 않음 (기본 권장 시간 : 0.3초)
		 * - 변위가 특정 길이를 넘기지 않음
		 * 
		 * ### 변위이어도 되나?
		 * 
		 * 변위가 아닌 "누적 거리"로 판단하고자 한다면..  
		 * 일단 일반적으로는 탭으로 판정되지 않을 만큼의 거리를 짧은 시간 안에 움직이는 것이 어렵다. 제한 거리의 값이 합리적이라면 말이지.
		 * 실제로 그렇게 하는 놈이 나온다면 그것은 기계적으로 마우스를 임의 조작한 것이라 판단한다.
		 * 그런 놈들을 상대하기 위해 누적 거리를 재느니 더 간단하게 계산할 수 있는 변위를 가지고 판단하겠다.
		 */
		let isTap = (endTime - startTime < 300) && (Math.abs(distance) < maximumTapDistance) ;
		if (isTap) {
			// 퍼즐 조각을 클릭하기만 한 것이라면 모델에서 조각들을 직접 회전시키고, 뷰를 업데이트한다.
			this.updateModelThenView(game);
		} else {
			// 퍼즐 조각을 물리적으로 움직인 것이라면 영향을 받은 모든 조각들을 바른 위치에 놓은 후, 모델을 업데이트한다.
			this.updateModelByView(game);
		}

		// 이제 마우스 놓기 처리가 완전히 끝났을 것이므로 데이터를 정리한다.
		this.piece = null;
		this.moveAxis = null;
		this.concern = null;
	}

	/**
	 * 모델을 먼저 바꾸고, 뷰가 모델을 따라도록 한다.
	 * 이 놈은 마우스를 놓을 때에만 실행되며 마우스 놓기 핸들러와 동등한 것으로 본다.
	 */
	updateModelThenView(game : Game) {

			/** 태그의 배열 */
			const vector : number[] = [];

			const start = this.moveAxis == 'h' ? this.row * game.size : this.col;
			const increment = this.moveAxis == 'h' ? 1 : game.size;

			// 퍼즐 모델에서 태그의 행벡터 또는 열벡터를 가져온다.
			for (let i = 0; i < game.size; i++) {
				let index = start + increment * i;
				vector[i] = game.puzzleModel[index];
			}

			// 클릭한 퍼즐의 태그가 뭐였더라?
			const currentTag = this.piece.tag;
			const currentTagPos = vector.indexOf(currentTag);

			// 빈칸의 위치를 얻는다.
			const blankTagPos = vector.indexOf(game.blankTag);

			// 빈칸이 현재 퍼즐 조각보다 뒤에(오른쪽 또는 아래) 있는지, 앞에 있는지(왼쪽 또는 위)를 판단한여 회전을 시킨다.
			if (currentTagPos < blankTagPos) {
				vector.splice(blankTagPos, 1);
				vector.splice(currentTagPos, 0, game.blankTag);
			} else {
				vector.splice(blankTagPos, 1);
				vector.splice(currentTagPos, 0, game.blankTag);
			}


			// 변경된 모델을 기반으로 조각들의 위치를 업데이트한다.
			for (let i = 0; i < game.size; i++) {
				let index = start + increment * i;
				game.puzzleModel[index] = vector[i];

				let p = game.pieces[vector[i]];

				let [row, col] = [Math.floor(index / game.size), index % game.size];
				let [destX, destY] = getPosition(row, col, game.len, game.left, game.top, game.size);

				p.destX = destX;
				p.destY = destY;
			}
	}

	/**
	 * 영향을 받은 퍼즐 조각들의 현재 위치(Piece.prototype.x, Piece.prototype.y)만을 가지고
	 * 모델을 업데이트한다. 이 놈은 마우스를 놓을 때에만 실행되며 마우스 놓기 핸들러와 동등한 것으로 본다.
	 * @deprecated 속도는 전혀 고려되지 않는다.
	 */
	updateModelByView(game : Game) {
		let modelChanges : ModelChange = {};
		for (const piece of this.concern) {
			if (piece.tag == game.blankTag)
				continue;
			// 영향을 받은 모든 퍼즐 조각들의 모델 행렬 위치를 얻는다. 
			let [row, col] = piece.whereami(game.left, game.top, game.len, game.size);
			// 변경점에 퍼즐 조각의 새로운 위치를 설정한다.
			modelChanges[row * game.size + col] = piece.tag;

			// 조각이 새로운 위치로 이동하도록 destX, destY를 설정한다.
			let destX = game.left + col * game.pieceSize;
			let destY = game.top + row * game.pieceSize;
			piece.destX = destX;
			piece.destY = destY;
		}
		// 옮기기 이후 모델의 변경점(changes)을 찾는다.
		const start = this.moveAxis == 'h' ? this.row * game.size : this.col;
		const increment = this.moveAxis == 'h' ? 1 : game.size;
		// 빈칸을 찾는다.
		for (let i = 0; i < game.size; i++) {
			let index = start + increment * i;
			if (!(index in modelChanges)) {
				modelChanges[index] = game.blankTag;
				break;
			}
		}
		// 변경점을 퍼즐 모델에 적용시킨다.
		for (const index in modelChanges) {
			const tag = modelChanges[index];
			game.puzzleModel[index] = tag;
		}
	}

	/** 마우스를 누르고 있는 때에 한해 업데이트(rAF)가 발생할 때 호출된다. 즉, 실질적 업데이트와 같다. */
	update(game: Game, holdInput : MouseInput) {
		if (this.moveAxis == "h" && holdInput.beforeX != null) {
			let x = holdInput.x - this.pieceOffsetX;
			this.piece.velX = x - this.piece.x;
		} else if (this.moveAxis == "v" && holdInput.beforeY != null) {
			let y = holdInput.y - this.pieceOffsetY;
			this.piece.velY = y - this.piece.y;
		}
		this.resolveCollision(game);
	}

	/**
	 * 현재 concern과 **grabbing에 대하여** 충돌 해결을 한 번 한다.
	 * 이것은 오로지
	 * # 잡고 있는 퍼즐만이 실제 속도를 가질 수 있다
	 * 는 것을 가정으로 실행된다.
	 * 
	 * 이것은 단 한 번의 호출로 충돌을 해결할 수 있다.
	 * 
	 * 위치관계를 이해하기 위해 현재상태를 보존할 필요성마저 없을 정도.
	 */
	private resolveCollision(game : Game) {
		const blankTag = game.blankTag
		const maxCount = this.concern.length;

		// 이 충돌 테스트는 잡고 있는 조각을 중심으로 하여 이전 방향과 이후 방향으로 전파(propagation)된다.
		const gIndex = this.moveAxis == "h" ? this.col : this.row;
		const [pos, vel] = this.moveAxis == "h"? ["x", "velX"] : ["y", "velY"];

		// 현재 축 상에서 잡은 조각의 속도를 알아낸다.
		const gVel : number = this.piece[vel];
		const gVsign = Math.sign(gVel);

		if (gVsign != 0) {
			// 누른 조각이 움직이는 방향 위에 있는 조각들만 생각하면 된다.		
			for (let a = gIndex; (a >= 0) && (a < maxCount); a += gVsign) {
				const A = this.concern[a];
				if (A.tag == blankTag) continue;
				for (let b = a + gVsign; (b >= 0) && (b < maxCount); b += gVsign) {
					const B = this.concern[b];
					if (B.tag == blankTag) continue;
					if (willHit(A, B, this.moveAxis)) {
						B[pos] = A[pos] + A[vel] + B.size * gVsign;
					}
				}
			}

			// 벽을 알아낸다.
			// 잡고 있는 조각 외에는 움직이지 않으므로 잡고 있는 조각이 어디(위, 아래, 왼쪽, 오른쪽)를 향하는지에 대해서만 영향을 받는다.
			// 끝점(right, bottom)에 대해서 size를 빼는 이유는, 비교를 용이하게 하기 위함이다.
			let backpressureLimit : number;
			if (this.moveAxis == "h") {
				backpressureLimit = gVsign < 0 ? game.left : game.right - this.piece.size;
			} else {
				backpressureLimit = gVsign < 0 ? game.top : game.bottom - this.piece.size;
			}

			// 벽에 가장 가까운 조각의 인덱스(빈칸 포함)를 알아낸다.
			const [start, end] = gVsign < 0 ? [0, maxCount] : [maxCount - 1, -1];
			for (let i = start; i != end; i -= gVsign) {
				if (this.concern[i].tag == game.blankTag) continue;
				const piece = this.concern[i];
				/* 
				다음의 식은 각각의 경우에 따라 이렇게 해석된다.
				- 왼쪽 진행인 경우 : concern[i][pos] = .x; gVsign = -1; backpressureLimit = left (+ N);
					=> -.x + left > 0
					=> .x < left
				- 오른쪽 진행인 경우 : concern[i][pos] = .x; gVsign = 1; backpressureLimit = right - size (+ N);
					=> x - right + size > 0
					=> x > right - size
				- 위로 진행인 경우 : concern[i][pos] = .y; gVsign = -1; backpressureLimit = top (+ N);
					=> -.y + top > 0
					=> .y < top
				- 아래로 진행인 경우 : concern[i][pos] = .y; gVsign = 1; backpressureLimit = bottom - size (+ N);
					=> .y - bottom + size > 0
					=> .y > bottom - size
				*/
				// 백프레스를 받을지 여부를 나타낸다. 백프레스를 받은 조각은 예외없이 조각의 움직임이 멈춘다.
				if ((piece[pos] + piece[vel] - backpressureLimit) * gVsign > 0) {
					piece[pos] = backpressureLimit;
					piece[vel] = 0;
					backpressureLimit += this.piece.size * (- gVsign);
				}
			}
		}
		
	}

}
