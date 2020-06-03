import Piece from "./Piece";
import Game from "./Game";
import { getPosition } from "./utils";
import Input from "./Input";

declare type ModelChange = {[i : number] : number};


export class Grab {

	/** 현재 누른 퍼즐 조각 */
	piece: Piece = null;

	/** 현재 누른 퍼즐 조각의 원래 행렬 위치 */
	row: number = null;
	col: number = null;

	/** 마우스 버튼이 눌리는 그 순간에 현재 퍼즐 조각의 왼쪽 끝에 상대적인 마우스 위치 */
	pieceOffsetX : number = null;
	pieceOffsetY :number = null;
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
	moveDirection: "v" | "h" | null = null;

	/** (rAF-sync) 마우스를 누를 때 실행된다. */
	onMousedown(m: MouseInputMessage, game: Game) {
		// 여기서는 [blankRow, blankCol] != [row, col]이다. 만약 둘이 같다면 이것은 실행조차 되지 않는다.
		let { startX: x, startY: y } = m;
		let [blankRow, blankCol] = game.rowColOfBlank;
		let [row, col] = game.getRowColAt(x, y);
		if (blankRow == row) {
			this.moveDirection = "h";
			this.concern = game.getVector(blankRow, "row");
		}
		else if (blankCol == col) {
			this.moveDirection = "v";
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
		let distance = this.moveDirection == 'h'? endX - startX : endY - startY;
		let isTap = (endTime - startTime < 300) && (Math.abs(distance) < 5) ;
		if (isTap) {
			// 퍼즐 조각을 클릭하기만 한 것이라면 모델에서 조각들을 직접 회전시키고, 뷰를 업데이트한다.
			
			/** 태그의 배열 */
			const vector : number[] = [];

			const start = this.moveDirection == 'h' ? this.row * game.size : this.col;
			const increment = this.moveDirection == 'h' ? 1 : game.size;

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
		} else {
			// 퍼즐 조각을 물리적으로 움직인 것이라면 영향을 받은 모든 조각들을 바른 위치에 놓은 후, 모델을 업데이트한다.
			this.updateModelByView(game);
		}

		// 이제 마우스 놓기 처리가 완전히 끝났을 것이므로 데이터를 정리한다.
		this.piece = null;
		this.moveDirection = null;
		this.concern = null;
	}

	/**
	 * 영향을 받은 퍼즐 조각들의 현재 위치(Piece.prototype.x, Piece.prototype.y)만을 가지고
	 * 모델을 업데이트한다.
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
		const start = this.moveDirection == 'h' ? this.row * game.size : this.col;
		const increment = this.moveDirection == 'h' ? 1 : game.size;
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

	/**
	 * 마우스를 누르고 있는 때에 한해 업데이트(rAF)가 발생할 때 호출된다. 즉, 실질적 업데이트와 같다.
	 */
	update(game: Game, holdInput : Input) {
		if (this.moveDirection == "h" && holdInput.beforeX != null) {
			let x = holdInput.x - this.pieceOffsetX;
			this.piece.velX = x - this.piece.x;
		}
		else if (this.moveDirection == "v" && holdInput.beforeY != null) {
			let y = holdInput.y - this.pieceOffsetY;
			this.piece.velY = y - this.piece.y;
		}
	}
}
