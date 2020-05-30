import Piece from "./Piece";
import PuzzleSet from "./PuzzleSet";
import { getRowCol, getPosition } from "./utils";
import Input from "./Input";
import { Grab } from "./Grab";
import Timer from "./Timer";


/** 퍼즐에서 아무 퍼즐 조각이나 선택하여, 그 조각의 행렬 위치를 얻는다. */
function selectRealPiece(model : number[], blankTag : number) {
	while (true) {
		let i = Math.floor(Math.random() * model.length);
		if (model[i] != blankTag) return i;
	}
}

/** 퍼즐의 해결 가능 여부를 실제로 판단한다. */
function checkSolvable(model : number[], blankTag : number) {
	let blankIndex = model.indexOf(blankTag);
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

	/**
	 * 게임 진행 중 여부
	 *   
	 * false : 아직 시작 버튼을 누르지 않은 상태. 
	 *  - 플레이어는 퍼즐 조각을 요리조리 움직여볼 수 있다.
	 *  - 타이머가 진행되지 않는다.
	 *  - 우연찮게 퍼즐을 완성시켜도 인정하지 않는다.
	 * 
	 * true : 플레이 중
	 *  - 타이머가 진행된다.
	 *  - 퍼즐을 완성시키면 클리어한 것으로 인정되고, 완성 이펙트가 뜨고, 이 값이 false로 돌아간다.
	 */
	playing : boolean = false

	
	/** 캔버스에서 퍼즐의 왼쪽 끝 위치 */
	left : number

	/** 캔버스에서 퍼즐의 위쪽 끝 위치 */
	top : number

	/** 퍼즐의 변의 길이 */
	len : number

	/** 한 행 또는 열의 퍼즐 조각의 수 */
	_num : number

	/** 이 게임에서 빈 칸에 해당하는 태그 */
	blankTag : number = 0

	/** 이 게임에서 번호를 표시할지 여부 */
	showLabel : boolean = false

	/** 
	 * 해결 가능한 퍼즐을 생성할 지 여부  
	 * 참고 : https://youtu.be/YI1WqYKHi78
	 *  */
	solvable : boolean

	/** 여기 값들은 실제 객체들에 들어갈 것이지만, 재설정 시에 퍼즐셋을 건드리지 않는다면 이것을 쓴다. */
	private _puzzleSet : PuzzleSet


	/** 입력을 처리하는 컴포넌트 */
	public readonly input : Input = new Input()

	/** 퍼즐 조각의 움직임을 컨트롤하는 컴포넌트 */
	public readonly grab : Grab = new Grab()

	/** 플레이 타임을 관리하는 컴포넌트 */
	public readonly timer : Timer = new Timer();

	/** 캔버스에서 퍼즐의 오른쪽 끝 위치 */
	get right () {
		return this.left + this.len;
	}

	/** 캔버스에서 퍼즐의 아래쪽 끝 위치 */
	get bottom () {
		return this.top + this.len;
	}

	/** 한 행 또는 열의 퍼즐 조각의 수 */
	get size() {
		return this._num;
	}

	/** 퍼즐 조각 하나의 변의 길이 */
	get pieceSize() {
		return this.len / this._num;
	}

	/** 현재 빈 칸의 행렬 위치 */
	get rowColOfBlank() : [number, number] {
		let i = this.puzzleModel.indexOf(this.blankTag);
		return [Math.floor(i / this._num), i % this._num];
	}

	constructor(size : number, puzzleSet : PuzzleSet, left : number, top : number, boardSize : number, upsideDown : boolean) {
		
		this.left = left;
		this.top = top;
		this.len = boardSize;

		this._num = size;

		this._puzzleSet = puzzleSet;
		
		this.init({ size, puzzleSet, upsideDown });

	}

	/** 진행 중인 게임을 중단하고, 퍼즐을 새로운 설정값으로 초기화한다. */
	init({ size, puzzleSet, upsideDown } : { size? : number, puzzleSet? : PuzzleSet, upsideDown? : boolean } = {} ) {

		this.end(null);
		if (size == null) size = this._num;
		this._num = size;

		if (puzzleSet == null) puzzleSet = this._puzzleSet;
		this._puzzleSet = puzzleSet;

		this.solvable = puzzleSet.solvable;

		const t = size * size;
		this.puzzleModel = new Array(t);
		this.pieces = new Array(t);

		const pieceLength = puzzleSet.srcLength / size;
		for (let tag = 0; tag < t; tag++) {
			this.puzzleModel[tag] = tag;
			let row = Math.floor(tag / size);
			let col = tag % size;
			let [x, y] = getPosition(row, col, puzzleSet.srcLength, puzzleSet.srcX, puzzleSet.srcY, size);
			this.pieces[tag] = new Piece(tag, puzzleSet.texture, x, y, pieceLength, this.len / size);
		}
		
		this.assignLabel(upsideDown);

		this.initPiecePosition();
	}

	/** 생성된 퍼즐 조각에 번호를 처음으로 또는 다시 붙인다. */
	assignLabel(upsideDown : boolean) {
		const totalPieces = this._num * this._num;
		for (let tag = 0; tag < totalPieces; tag++) {
			let vrow = Math.floor(tag / this._num);
			let vcol = tag % this._num;
			let lrow = upsideDown? this._num - vrow - 1 : vrow;
			let label = lrow * this._num + vcol + 1;
			this.pieces[tag].label = label.toString();
		}
	}


	/** (x, y) 좌표의 행렬 위치를 얻는다. */
	getRowColAt(x : number, y : number) : [number, number] {
		return getRowCol(x, y, this.len, this.left, this.top, this._num)
	}

	/** 지정 행렬 위치에 있는 퍼즐 조각을 얻는다. */
	getPieceAt(row : number, col : number) : Piece {
		let foundPosition = col + row * this._num;
		let foundTag = this.puzzleModel[foundPosition];
		return this.pieces[foundTag];
	}

	/** index번째 행벡터/열벡터를 얻는다. */
	getVector(index : number, orient : "row" | "col") : Piece[] {
		let ar : Piece[] = new Array(this._num);
		let start : number, increment : number;
		switch (orient) {
			case "row":
				start = index * this._num;
				increment = 1;
				break;
			case "col":
				start = index;
				increment = this._num;
				break;
		}
		for (let i = 0; i < this._num; i++) {
			ar[i] = this.pieces[this.puzzleModel[start + increment * i]];
		}
		return ar;
	}

	/** 퍼즐을 완성했을 때 빈 칸의 위치를 설정한다. */
	setBlankTag(bottom : boolean, right : boolean) {
		this.blankTag =  (this._num * (this._num - 1)) * Number(bottom) + (this._num - 1) * Number(right);
	}

	/** 퍼즐을 섞는다. Game 내에 있는 solvable 속성이 적용된다. */
	shuffle() {

		this.puzzleModel.sort(() => 0.5 - Math.random());

		let solvable = checkSolvable(this.puzzleModel, this.blankTag);
		if (checkSolvable(this.puzzleModel, this.blankTag) != this.solvable) {
			let a = selectRealPiece(this.puzzleModel, this.blankTag);
			let b : number;
			do {
				b = selectRealPiece(this.puzzleModel, this.blankTag);
			} while (a == b)
			let t = this.puzzleModel[a];
			this.puzzleModel[a] = this.puzzleModel[b];
			this.puzzleModel[b] = t;
		}
		solvable = checkSolvable(this.puzzleModel, this.blankTag);
	}

	/**
	 * 퍼즐 조각들을 모두 제자리에 놓는다.  
	 * (퍼즐 조각의 위치를 퍼즐 모델과 일치시킨다.)
	 * */
	initPiecePosition() {

		const totalPieces = this._num * this._num;
		const num = this._num;
		const len = this.len;


		for (let i = 0; i < totalPieces; i++) {
			const tag = this.puzzleModel[i];
			
			let row = Math.floor(i / num);
			let col = (i % num);

			this.pieces[tag].x = this.left + col * len / num;
			this.pieces[tag].y = this.top + row * len / num;
		}
	}

	/** rAF에 동기화된 이벤트 핸들 플래그 */
	rAFSyncMousedownMessage : boolean = false
	rAFSyncMouseupMessage : boolean = false

	/** rAF에 동기화된 마우스 클릭 핸들러 */
	onMousedown() {
		/* 이 메서드는 반드시 input.handleMousedown() 이후에 호출되므로 이 메서드가 시작하는 시점에서는 input의 모든 속성들이 유효값을 가지고 있다. */
		this.grab.onMousedown(this.input, this);

		// 아직 제 자리를 못 찾고 헤매는 조각이 있으면 곧바로 destX,destY 값을 적용시켜 즉시 이동한다.
		for (const piece of this.grab.concern) {
			if (piece.tag != this.blankTag) piece.getIntoPositionNow();
		}
	}

	/** rAF에 동기화된 마우스 놓기 핸들러 */
	onMouseup() {
		this.grab.onMouseup(this.input, this);
	}

	private _noop () {}
	private _updateForPlaying (t : DOMHighResTimeStamp) {
		if (this.isSolved()) {
			this.onComplete(t);
			return;
		}
		this.timer.update(t);
	}

	private handlePlay : Function = this._noop

	/** 매 rAF마다 호출된다. */
	update(t : DOMHighResTimeStamp) {
		let grab = this.grab;

		this.input.clock();
		if (this.rAFSyncMousedownMessage) {
			this.onMousedown();
			// insert code here
			this.rAFSyncMousedownMessage = false;
		}

		if (grab.piece) {
			grab.update(this);
		}

		if (this.rAFSyncMouseupMessage) {
			this.onMouseup();
			// insert code here
			this.rAFSyncMouseupMessage = false;
		}

		for (const piece of this.pieces) {
			if (piece.tag != this.blankTag) piece.update(this);
		}
		// todo resolveCollision
		this.handlePlay(t)
	}

	/** 게임을 시작한다. */
	start(startTime : DOMHighResTimeStamp) {
		this.handlePlay = this._updateForPlaying;
		this.playing = true;
		this.timer.start(startTime);
	}

	/** 게임을 끝낸다. (게임 중단, 게임 클리어 모두 포함) */
	end(endTime : DOMHighResTimeStamp) { 
		this.handlePlay = this._noop;
		this.playing = false;
		this.timer.end(endTime);
	}

	/** 퍼즐이 완성되었는지 판단한다. */
	isSolved () {
		for (let i = 0 ; i < this.puzzleModel.length; i++) {
			if (this.puzzleModel[i] != i) return false;
		}
		return true;
	}

	/** 퍼즐을 완성했을 때 실행된다. */
	onComplete(t : DOMHighResTimeStamp) {
		this.end(t);
	}
	
	/**
	 * 주어진 좌표를 클릭했을 때 마우스 드래그/놓기 이벤트를 활성화시킬 것인지 여부  
	 * accept되지 않으면 **입력 자체가 완전히 무시되어 버린다.**
	 */
	acceptCoordinate(x : number, y : number) {
		// 퍼즐 밖 영역을 클릭하면 드래그로 이어지지 않는다.
		if (x < this.left || x > this.right || y < this.top || y > this.bottom) return false;
		
		// 움직일 수 없는 조각을 클릭하면 드래그로 이어지지 않는다.
		let [blankRow, blankCol] = this.rowColOfBlank;
		let [row, col] = this.getRowColAt(x, y);

		if ((blankRow == row) == (blankCol == col)) return false;

		return true;
	}


	/** 그린다. */
	render(context : CanvasRenderingContext2D) {
		context.clearRect(0, 0, 360, 480);
		for (const piece of this.pieces) {
			if (piece.tag != this.blankTag) piece.render(context, this.showLabel);
		}
		this.timer.render(context, this.left, this.len, 420);
	}

}


