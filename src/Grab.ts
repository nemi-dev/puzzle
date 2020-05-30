import Piece from "./Piece";
import Input from "./Input";
import Game from "./Game";

export class Grab {

	/** 마우스 버튼을 누른 행렬 위치 */
	row: number = null;
	col: number = null;

	/** 현재 누른 퍼즐 조각을 나타낸다. */
	piece: Piece = null;

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
	onMousedown(input: Input, game: Game) {
		// 여기서는 [blankRow, blankCol] != [row, col]이다. 만약 둘이 같다면 이것은 실행조차 되지 않는다.
		let { startX: x, startY: y } = input;
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
	}

	/** (rAF-sync) 마우스를 놓을 때 실행된다. */
	onMouseup(input: Input, game: Game) {
		let { moveX, moveY } = input;
		console.log ({ moveX, moveY });
		let isDrag = true;
		if (isDrag) {
			// 퍼즐 조각을 물리적으로 움직인 것이라면 영향을 받은 모든 조각들을 바른 위치에 놓은 후, 모델을 업데이트한다.
			let modelChanges: { [k: number]: number; } = {};
			for (const piece of this.concern) {
				if (piece.tag == game.blankTag)
					continue;
				// 영향을 받은 모든 퍼즐 조각들의 모델 행렬 위치를 얻는다. 
				let [row, col] = piece.whereami(game.left, game.top, game.len, game.size);
				// 모델을 딴다.
				let flattenizedPosition = row * game.size + col;
				modelChanges[flattenizedPosition] = piece.tag;
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
			for (const index in modelChanges) {
				const tag = modelChanges[index];
				game.puzzleModel[index] = tag;
			}
		} else {

		}

		this.piece = null;
		this.moveDirection = null;
		this.concern = null;
	}
	/**
	 * 마우스를 누르고 있는 때에 한해 업데이트(rAF)가 발생할 때 호출된다. 즉, 실질적 업데이트와 같다.
	 */
	update(game: Game) {
		if (this.moveDirection == "h" && game.input.beforeX != null) {
			this.piece.push(game.input.moveX, 'h', game, this.concern);
		}
		else if (this.moveDirection == "v" && game.input.beforeY != null) {
			this.piece.push(game.input.moveY, 'v', game, this.concern);
		}
	}
}
