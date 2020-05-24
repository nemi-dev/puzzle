import Piece from "./Piece";
import PuzzleSet from "./PuzzleSet";
import { getRowCol } from "./utils";

function isSolvable(model : number[]) {
	let blankIndex = model.indexOf(0);
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

	/** 고의적으로 해결 불가능한 퍼즐을 생성할 지 여부 */
	screw : boolean

	/** 좌우반전 */
	flipH : boolean = false

	/** 상하반전 */
	flipV : boolean = true

	/** 퍼즐 조각을 컨트롤하는 컴포넌트 */
	readonly grab : GrabAndInput = new GrabAndInput()

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
		let i = this.puzzleModel.indexOf(0);
		return [Math.floor(i / this.countDimension), i % this.countDimension];
	}

	constructor(countDimension : number, puzzleSet : PuzzleSet, left : number, top : number, boardSize : number) {
		
		this.left = left;
		this.top = top;
		this.boardSize = boardSize;
		this.countDimension = countDimension;
		this.screw = puzzleSet.screw;

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

	/** 퍼즐을 섞는다. Game 내에 있는 screw 속성이 적용된다. */
	shuffle() {

		const totalPieces = this.countDimension * this.countDimension;
		const puzzleModel = this.puzzleModel;

		const selectRealPiece = () => {
			do {
				let i = Math.floor(Math.random() * totalPieces);
				let v = puzzleModel[i];
				if (v != 0) return i;
			} while (true);
		}

		puzzleModel.sort(() => 0.5 - Math.random());

		if (isSolvable(puzzleModel) != this.screw) {
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
	rAFMousedown() {
		/* 이 메서드는 반드시 grab.handleGrab() 이후에 호출되므로 이 메서드가 시작하는 시점에서는 grab의 모든 속성들이 유효값을 가지고 있다. */

	}

	/** rAF에 동기화된 마우스 놓기 핸들러 */
	rAFMouseup() {
		for (const piece of this.grab.concern) {
				let [row, col] = piece.whereami(this.left, this.top, this.boardSize, this.countDimension, this.flipH, this.flipV);
		}
	}

	/** 매 rAF마다 호출된다. */
	update() {
		const grab = this.grab;
		if (this.rAFSyncMousedownMessage) {
			this.rAFMousedown()
			this.rAFSyncMousedownMessage = false;
		}
		if (grab.grabbing) {
			grab.update(this);
		}
		if (this.rAFSyncMouseupMessage) {
			this.rAFMouseup()
			this.rAFSyncMouseupMessage = false;
		}
		for (const piece of this.pieces) {
			piece.update(this);
		}
	}

	
	

	private mousedown : (ev : MouseEvent) => void
	private mousemove : (ev : MouseEvent) => void
	private mouseup : (ev : MouseEvent) => void


	connectView (canvas : HTMLCanvasElement) {
		this.mousemove = ev => {
			this.grab.handleMove(ev.offsetX, ev.offsetY, this)
		}
		this.mouseup = ev => {
			this.grab.handleRelease(ev.offsetX, ev.offsetY, ev.timeStamp, this)
			canvas.removeEventListener('mousemove', this.mousemove);
			canvas.removeEventListener('mouseup', this.mouseup);
			this.rAFSyncMouseupMessage = true;
		}
		this.mousedown = ev => {
			if (this.grab.handleGrab(ev.offsetX, ev.offsetY, ev.timeStamp, this)) {
				canvas.addEventListener('mousemove', this.mousemove);
				canvas.addEventListener('mouseup', this.mouseup);
				this.rAFSyncMousedownMessage = true;
			}
		}
		canvas.addEventListener('mousedown', this.mousedown);
	}

	disconnectView(canvas : HTMLCanvasElement) {
		if (this.mousedown)
		canvas.removeEventListener('mousedown', this.mousedown);
		
		if (this.mousemove)
		canvas.removeEventListener('mousemove', this.mousemove);

		if (this.mouseup)
		canvas.removeEventListener('mouseup', this.mouseup);
	}

	render(context : CanvasRenderingContext2D) {
		context.clearRect(0, 0, 400, 400);
		for (const piece of this.pieces) {
			piece.render(context);
		}
	}
}

/**
 * @TODO 두 개의 역할이 섞여 있음. 재주껏 걸러내시오.
 */
class GrabAndInput {

	/**
	 * 마우스 버튼을 누른 위치
	 */
	startX : number = null
	startY : number = null

	/**
	 * 마우스 버튼을 누른 행렬 위치
	 */
	row : number = null
	col : number = null

	/**
	 * 마우스 버튼을 놓은 위치
	 */
	endX : number = null
	endY : number = null

	/**
	 * EventListener로 받아들인 임시 마우스 위치 (또는 퍼즐 위치)  
	 * Listener가 마우스 좌표를 받아들이면 퍼즐 조각에 바로 반영하지 않고, requestAnimationFrame이 돌아올 때까지 기다린다. (이벤트 핸들링이 rAF보다 훨씬 많이 발생한다.)  
	 * 따라서 쏟아지는 이벤트로 인해 불필요하게 성능이 저하되는 것을 방지한다.  
	 * 어떤 이벤트 루프에서 rAF가 발생하지 않으면 해당 루프로 받아들인 좌표는 버려지게 된다.
	 * */
	private inputX : number = null
	private inputY : number = null

	/** 마우스 버튼을 누르고 놓은 타임스탬프를 나타낸다. 마우스를 떼면 null로 초기화된다.
	 * 길게 클릭 여부를 확인하는 데 사용된다.
	 */
	private startTime : number = null;
	private endTime : number = null;

	/**
	 * beforeX, beforeY는 마지막 update(rAF)가 발생하기 직전의 마우스 (또는 퍼즐 조각) 위치를 나타낸다.
	 */
	private beforeX : number = null
	private beforeY : number = null

	/**
	 * diffX, diffY는 rAF 간의 beforeX, beforeY의 변화량을 나타낸다.
	 */
	diffX : number = null
	diffY : number = null

	/**
	 * 현재 누른 퍼즐 조각을 나타낸다.
	 */
	piece : Piece = null

	/**
	 * 실제로 퍼즐 조각을 잡고 있는지를 나타낸다.
	 * piece의 Nullity를 검사하는 것은 적절하지 않은 듯.
	 */
	grabbing : boolean = false

	/**
	 * 현재 누른 퍼즐 조각과 같은 행 또는 열에 있는 조각들의 모음이다.
	 * 충돌 테스트는 여기 있는 조각들에 한해서 실행된다.
	 */
	concern : Piece[] = null


	/**
	 * 현재 누른 퍼즐 조각을 어느 방향으로 움직일 수 있는지 나타낸다.
	 */
	direction : "v" | "h" | null = null


	handleGrab(x : number, y : number, t : number, game : Game) {
		if (x < game.left || x > game.right || y < game.top || y > game.bottom) return false;
		
		let [blankRow, blankCol] = game.rowColOfBlank;
		let [row, col] = game.getRowColAt(x, y);
		if (blankRow == row) {
			if (blankCol == col) return false;
			this.direction = "h";
			this.concern = game.getVector(blankRow, "row");
		} else if (blankCol == col) {
			this.direction = "v";
			this.concern = game.getVector(blankCol, "col");
		}

		
		this.startX = x;
		this.startY = y;
		this.startTime = t;

		this.endX = null;
		this.endY = null;
		this.endTime = null;

		this.row = row;
		this.col = col;
		
		this.inputX = null;
		this.inputY = null;

		this.beforeX = null;
		this.beforeY = null;

		this.diffX = null;
		this.diffY = null;

		this.piece = game.getPieceAt(row, col);
		this.grabbing = true;
		
		game.rAFSyncMousedownMessage = true;
		
		return true;
	}

	handleMove(x : number, y: number, game : Game) {
		if (this.direction == "h") this.inputX = x;
		else if (this.direction == "v") this.inputY = y;
	}

	/**
	 * 마우스를 누르고 있는 때에 한해 업데이트(rAF)가 발생할 때 호출된다. 즉, 실질적 업데이트와 같다.
	 */
	update(game : Game) {
		/** 이 컨텍스트에서는 ix, iy가 실제 입력값으로 사용된다. */
		this.diffX = 0;
		this.diffY = 0;
		if (this.beforeX != null) {
			this.diffX = this.inputX - this.beforeX;
		}
		if (this.beforeY != null) {
			this.diffY = this.inputY - this.beforeY;
		}

		if (this.inputX != null) this.beforeX = this.inputX;
		if (this.inputY != null) this.beforeY = this.inputY;


		/** 이 부분부터는 실제 충돌 체크(Grab)를 나타내므로 윗 부분과 독립되어야 할 것이다. */
		if (this.direction == "h" && this.beforeX != null) {
			this.piece.push(this.diffX, 'h', game, this.concern);
		} else if (this.direction == "v" && this.beforeY != null) {
			this.piece.push(this.diffY, 'v', game, this.concern);
		}
	}

	handleRelease(x : number, y : number, t: number, game : Game) {
		this.endX = x;
		this.endY = y;
		this.endTime = t;

		game.rAFSyncMouseupMessage = true;

		this.piece = null;
		this.direction = null;
		this.concern = null;
		this.grabbing = false;
	}
}
