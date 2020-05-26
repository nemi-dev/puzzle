import Piece from "./Piece";
import PuzzleSet from "./PuzzleSet";
import { getRowCol } from "./utils";
import Input from "./Input";

function isSolvable(model : number[]) {
	let blankIndex = model.indexOf(Piece.blankTag);
	let countDimension = Math.sqrt(model.length);

	let blankRow = Math.floor( blankIndex / countDimension );
	let blankCol = blankIndex % countDimension;

	let parity = (blankRow + blankCol) % 2

	let inversion = 0;
	for (let i = 0; i < model.length; i++) {
		for (let j = i + 1; j < model.length; j++) {
			if (model[i] > model[j]) inversion++;
		}
	}
	return inversion % 2 == parity
}

export default class Game {

	/**
	 * 퍼즐의 실제 모델   
	 * 어떠한 경우든 [ 0, 1, ..., n-1 ] 순서가 정답이다.
	 */
	puzzleModel : number[]

	/**
	 * 퍼즐 조각 모음  
	 * piece[n]은 반드시 n번 퍼즐 조각을 나타낸다. 배열 내에서 퍼즐 조각의 순서는 절대로 바뀌지 않는다.
	 */
	pieces : Piece[]

	/** 캔버스에서 퍼즐의 왼쪽 끝 위치 */
	left : number

	/** 캔버스에서 퍼즐의 위쪽 끝 위치 */
	top : number

	/** 퍼즐의 변의 길이 */
	boardSize : number

	/** 한 행 또는 열의 퍼즐 조각의 수 */
	countDimension : number

	/** 
	 * 해결 가능한 퍼즐을 생성할 지 여부  
	 * 참고 : https://youtu.be/YI1WqYKHi78
	 *  */
	solvable : boolean

	/** 좌우반전 */
	flipH : boolean = false

	/** 상하반전 */
	flipV : boolean = false

	/** 입렧을 처리하는 컴포넌트 */
	public readonly input : Input = new Input()

	/** 퍼즐 조각의 움직임을 컨트롤하는 컴포넌트 */
	public readonly grab : Grab = new Grab()

	/** 캔버스에서 퍼즐의 오른쪽 끝 위치 */
	get right () {
		return this.left + this.boardSize;
	}

	/** 캔버스에서 퍼즐의 아래쪽 끝 위치 */
	get bottom () {
		return this.top + this.boardSize;
	}

	/** 퍼즐 조각 하나의 변의 길이 */
	get pieceSize() {
		return this.boardSize / this.countDimension;
	}

	/** 현재 빈 칸의 행렬 위치 */
	get rowColOfBlank() : [number, number] {
		let i = this.puzzleModel.indexOf(Piece.blankTag);
		return [Math.floor(i / this.countDimension), i % this.countDimension];
	}

	constructor(countDimension : number, puzzleSet : PuzzleSet, left : number, top : number, boardSize : number) {
		
		this.left = left;
		this.top = top;
		this.boardSize = boardSize;
		this.countDimension = countDimension;
		this.solvable = puzzleSet.solvable;

		const totalPieces = countDimension * countDimension;

		const puzzleSetDimension = puzzleSet.dimension / countDimension;
		this.puzzleModel = new Array(totalPieces);
		this.pieces = new Array(totalPieces);
		for (let tag = 0; tag < totalPieces; tag++) {
			let vrow = Math.floor(tag / countDimension);
			if (this.flipV) vrow = countDimension - vrow - 1;

			let vcol = tag % countDimension;
			if (this.flipH) vcol = countDimension - vcol - 1;

			this.puzzleModel[tag] = tag;

			let [x, y] = puzzleSet.getPosition(vrow, vcol, countDimension);
			this.pieces[tag] = new Piece(tag, puzzleSet.texture, x, y, puzzleSetDimension, boardSize / countDimension);
		}

		this.initViewForModel();
	}

	/** 퍼즐을 섞는다. Game 내에 있는 solvable 속성이 적용된다. */
	shuffle() {

		const totalPieces = this.countDimension * this.countDimension;
		const puzzleModel = this.puzzleModel;

		const selectRealPiece = () => {
			do {
				let i = Math.floor(Math.random() * totalPieces);
				let v = puzzleModel[i];
				if (v != Piece.blankTag) return i;
			} while (true);
		}

		puzzleModel.sort(() => 0.5 - Math.random());

		if (isSolvable(puzzleModel) != this.solvable) {
			let a = selectRealPiece();
			let b = selectRealPiece();
			while (a == b) b = selectRealPiece();
			let t = puzzleModel[a];
			puzzleModel[a] = puzzleModel[b];
			puzzleModel[b] = t;
		}
	}

	/** (x, y) 좌표의 행렬 위치를 얻는다. */
	getRowColAt(x : number, y : number) : [number, number] {
		return getRowCol(x, y, this.boardSize, this.left, this.top, this.countDimension, this.flipH, this.flipV)
	}

	/** 현재 행렬 위치에 있는 퍼즐 조각을 얻는다. */
	getPieceAt(row : number, col : number) : Piece {
		
		let foundPosition = col + row * this.countDimension;

		let foundTag = this.puzzleModel[foundPosition];

		return this.pieces[foundTag];
	}

	/** index번째 행벡터/열벡터를 얻는다. */
	getVector(index : number, orient : "row" | "col") : Piece[] {
		let ar : Piece[] = new Array(this.countDimension);
		let start : number, increment : number;
		switch (orient) {
			case "row":
				start = index * this.countDimension;
				increment = 1;
				break;
			case "col":
				start = index;
				increment = this.countDimension;
				break;
		}
		for (let i = 0; i < this.countDimension; i++) {
			ar[i] = this.pieces[this.puzzleModel[start + increment * i]];
		}
		return ar;
	}

	/** 뷰를 초기화한다. */
	initViewForModel() {

		const totalPieces = this.countDimension * this.countDimension;
		const puzzleModel = this.puzzleModel;
		const pieces = this.pieces;
		const left = this.left;
		const top = this.top;
		const dimension = this.countDimension;
		const boardSize = this.boardSize;


		for (let i = 0; i < totalPieces; i++) {
			const tag = puzzleModel[i];
			
			let row = Math.floor(i / dimension);
			if (this.flipV) row = dimension - row - 1;

			let col = (i % dimension);
			if (this.flipH) col = dimension - col - 1;

			pieces[tag].x = left + col * boardSize / dimension;
			pieces[tag].y = top + row * boardSize / dimension;
		}
	}

	/** rAF에 동기화된 이벤트 핸들 플래그 */
	rAFSyncMousedownMessage : boolean = false
	rAFSyncMouseupMessage : boolean = false

	/** rAF에 동기화된 마우스 클릭 핸들러 */
	onMousedown() {
		/* 이 메서드는 반드시 input.handleMousedown() 이후에 호출되므로 이 메서드가 시작하는 시점에서는 input의 모든 속성들이 유효값을 가지고 있다. */
		this.grab.onMousedown(this.input, this);
	}

	/** rAF에 동기화된 마우스 놓기 핸들러 */
	onMouseup() {
		this.grab.onMouseup(this.input, this);
		
	}

	/** 매 rAF마다 호출된다. */
	update() {
		let input = this.input;
		let grab = this.grab;
		input.clock();
		if (this.rAFSyncMousedownMessage) {
			this.onMousedown();
			this.rAFSyncMousedownMessage = false;
		}
		if (grab.piece) {
			grab.update(this);
		}
		if (this.rAFSyncMouseupMessage) {
			this.onMouseup()
			this.rAFSyncMouseupMessage = false;
		}
		for (const piece of this.pieces) {
			piece.update(this);
		}
	}

	
	/**
	 * 주어진 좌표를 클릭했을 때 마우스 드래그/놓기 이벤트를 활성화시킬 것인지 여부  
	 * accept되지 않으면 **입력 자체가 완전히 무시되어 버린다.**
	 */
	acceptCoordinate(x : number, y : number) {
		// 퍼즐 밖 영역을 클릭하면 드래그로 이어지지 않는다.
		if (x < this.left || x > this.right || y < this.top || y > this.bottom) return false;
		
		// 움직일 수 없는 조각을 클릳하면 드래그로 이어지지 않는다.
		let [blankRow, blankCol] = this.rowColOfBlank;
		let [row, col] = this.getRowColAt(x, y);

		if ((blankRow == row) == (blankCol == col)) return false;

		return true;
	}


	render(context : CanvasRenderingContext2D) {
		context.clearRect(0, 0, 360, 360);
		for (const piece of this.pieces) {
			piece.render(context);
		}
	}
}

/**
 * @TODO 두 개의 역할이 섞여 있음. 재주껏 걸러내시오.
 */
class Grab {

	/** 마우스 버튼을 누른 행렬 위치 */
	row : number = null
	col : number = null
	

	/** 현재 누른 퍼즐 조각을 나타낸다. */
	piece : Piece = null


	/**
	 * 현재 누른 퍼즐 조각과 같은 행 또는 열에 있는 조각들의 모음이다.
	 * 충돌 테스트는 여기 있는 조각들에 한해서 실행된다.
	 */
	concern : Piece[] = null


	/**
	 * 현재 누른 퍼즐 조각을 어느 방향으로 움직일 수 있는지 나타낸다.  
	 * 이 값이 'h'이면 퍼즐 조각을 좌우좌로 움직일 수 있고, 퍼즐 중에서 행(row)이 선택된 것이다.  
	 * 'v'이면 퍼즐 조각을 세로로 움직일 수 있고, 열(col)이 선택된 것이다.
	 */
	moveDirection : "v" | "h" | null = null

	/** (rAF-sync) 마우스를 누를 때 실행된다. */
	onMousedown(input : Input, game : Game) {
		// 여기서는 [blankRow, blankCol] != [row, col]이다. 만약 둘이 같다면 이것은 실행조차 되지 않는다.
		let { startX : x, startY : y } = input;
		let [blankRow, blankCol] = game.rowColOfBlank;
		let [row, col] = game.getRowColAt(x, y);
		if (blankRow == row) {
			this.moveDirection = "h";
			this.concern = game.getVector(blankRow, "row");
		} else if (blankCol == col) {
			this.moveDirection = "v";
			this.concern = game.getVector(blankCol, "col");
		}

		this.row = row;
		this.col = col;
		
		this.piece = game.getPieceAt(row, col);
	}

	/** (rAF-sync) 마우스를 놓을 때 실행된다. */
	onMouseup(input : Input, game : Game) {
		let isDrag = true;

		if (isDrag) {
			// 퍼즐 조각을 물리적으로 움직인 것이라면 영향을 받은 모든 조각들을 바른 위치에 놓은 후, 모델을 업데이트한다.
			let modelChanges : {[k : number] : number} = {};
			for (const piece of this.concern) {
				if (piece.tag == Piece.blankTag) continue;

				// 영향을 받은 모든 퍼즐 조각들의 모델 행렬 위치를 얻는다. 
				let [row, col] = piece.whereami(game.left, game.top, game.boardSize, game.countDimension, game.flipH, game.flipV);

				// 모델을 딴다.
				let flattenizedPosition = row * game.countDimension + col;
				modelChanges[flattenizedPosition] = piece.tag;

				// 이제 모델에는 for 루프의 로컬 변수 row, col은 더 이상 필요없다.
				// 실제 좌표에 사용하기 위해 모델 행렬 위치를 다시 반전시킨다.
				if (game.flipH) col = game.countDimension - col - 1;
				if (game.flipV) row = game.countDimension - row - 1;
				let destX = game.left + col * game.pieceSize;
				let destY = game.top + row * game.pieceSize;
				
				piece.destX = destX;
				piece.destY = destY;

			}

			// 옮기기 이후 모델의 변경점(changes)을 찾는다.
			const start = this.moveDirection == 'h'? this.row * game.countDimension : this.col;
			const increment = this.moveDirection == 'h'? 1 : game.countDimension;

			// 빈칸을 찾는다.
			for (let i = 0; i < game.countDimension; i++) {
				let index = start + increment * i;
				if (!(index in modelChanges)) {
					modelChanges[index] = Piece.blankTag;
					break;
				}
			}

			for (const index in modelChanges) {
				const tag = modelChanges[index];
				game.puzzleModel[index] = tag;
			}
		}


		this.piece = null;
		this.moveDirection = null;
		this.concern = null;
	}



	/**
	 * 마우스를 누르고 있는 때에 한해 업데이트(rAF)가 발생할 때 호출된다. 즉, 실질적 업데이트와 같다.
	 */
	update(game : Game) {
		
		if (this.moveDirection == "h" && game.input.beforeX != null) {
			this.piece.push(game.input.moveX, 'h', game, this.concern);
		} else if (this.moveDirection == "v" && game.input.beforeY != null) {
			this.piece.push(game.input.moveY, 'v', game, this.concern);
		}
	}

}
