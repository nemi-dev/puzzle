
export interface InputListener {
	putMousedownMessage() : void
	acceptCoordinate(x : number, y : number) : boolean
	putMouseupMessage() : void	
}

/**
 * DOM 이벤트를 이용하여 마우스 입력을 받아들이는 컴포넌트
 * 이벤트 루프가 rAF보다 훨씬 빈번하게 일어나므로 입력값을 rAF-synchronize시키는 기능도 있다.
 */
export class Input {

	/**
	 * EventListener로 받아들인 임시 마우스 위치 (또는 퍼즐 위치)  
	 * Listener가 마우스 좌표를 받아들이면 퍼즐 조각에 바로 반영하지 않고, requestAnimationFrame이 돌아올 때까지 기다린다. (이벤트 핸들링이 rAF보다 훨씬 많이 발생한다.)  
	 * 따라서 쏟아지는 이벤트로 인해 불필요하게 성능이 저하되는 것을 방지한다.  
	 * 어떤 이벤트 루프에서 rAF가 발생하지 않으면 해당 루프로 받아들인 좌표는 버려지게 된다.
	 * */
	private inputX : number = null
	private inputY : number = null

	/**
	 * 컴포넌트 외부에서 실제로 쓸 수 있도록 한 현재 마우스 좌표
	 */
	x : number = null
	y : number = null

	/** (private) 마지막 update(rAF)가 발생하기 직전의 마우스 위치 */
	private _beforeX : number = null
	private _beforeY : number = null

	/** 마지막 update(rAF)가 발생하기 직전의 마우스 위치 */
	get beforeX() { return this._beforeX }
	get beforeY() { return this._beforeY }

	/** (private) update(rAF) 간의 beforeX, beforeY의 변화량 */
	private _moveX : number = null
	private _moveY : number = null

	/** update(rAF) 간의 beforeX, beforeY의 변화량 */
	get moveX() { return this._moveX }
	get moveY() { return this._moveY }

	/** 마우스 버튼을 누른 위치와 시각 */
	public startX : number = null
	public startY : number = null
	public startTime : number = null

	/** 마우스 버튼을 놓은 위치와 시각 */
	public endX : number = null
	public endY : number = null
	public endTime : number = null

	private mousedown : (ev : MouseEvent) => void
	private mousemove : (ev : MouseEvent) => void
	private mouseup : (ev : MouseEvent) => void

	/** 입력 컴포넌트를 뷰에 연결한다. */
	connect (canvas : HTMLCanvasElement, listener : InputListener) {
		this.disconnect(canvas);
		this.mousemove = ev => {
			this.handleMousemove(ev.offsetX, ev.offsetY, listener)		
		};
		this.mouseup = ev => {
			this.handleMouseup(ev.offsetX, ev.offsetY, ev.timeStamp, listener);
			canvas.removeEventListener('mousemove', this.mousemove);
			document.removeEventListener('mouseup', this.mouseup);
			// listener.rAFSyncMouseupMessage = true;
			listener.putMouseupMessage();
		};
		this.mousedown = ev => {
			ev.preventDefault();
			if (listener.acceptCoordinate(ev.offsetX, ev.offsetY)) {
				this.handleMousedown(ev.offsetX, ev.offsetY, ev.timeStamp, listener);
				canvas.addEventListener('mousemove', this.mousemove);
				document.addEventListener('mouseup', this.mouseup);
			}
			return false;
		}
		canvas.addEventListener('mousedown', this.mousedown);
	}

	/** 입력 컴포넌트 연결을 해제한다. */
	disconnect (canvas : HTMLCanvasElement) {
		if (this.mousedown) {
			canvas.removeEventListener('mousedown', this.mousedown);
			this.mousedown = null;
		}
		if (this.mousemove) {
			canvas.removeEventListener('mousemove', this.mousemove);
			this.mousemove = null;
		}
		if (this.mouseup) {
			document.removeEventListener('mouseup', this.mouseup);
			this.mouseup = null;
		}
	}


	handleMousedown(x : number, y : number, t : number, listener : InputListener) {
		this.startX = x;
		this.startY = y;
		this.startTime = t;

		this.endX = null;
		this.endY = null;
		this.endTime = null;

		this._beforeX = null;
		this._beforeY = null;

		this.inputX = null;
		this.inputY = null;
		this._moveX = null;
		this._moveY = null;

		listener.putMousedownMessage()
		
	}

	handleMousemove(x : number, y : number, listener : InputListener) {
		this.inputX = x;
		this.inputY = y;
	}

	handleMouseup(x : number, y : number, t : number, listener : InputListener) {
		this.endX = x;
		this.endY = y;
		this.endTime = t;

		listener.putMouseupMessage();
	}

	/** rAF */
	clock() {
		this._moveX = 0;
		this._moveY = 0;
		if (this._beforeX != null) {
			this._moveX = this.inputX - this._beforeX;
		}
		if (this._beforeY != null) {
			this._moveY = this.inputY - this._beforeY;
		}

		if (this.inputX != null) this._beforeX = this.inputX;
		if (this.inputY != null) this._beforeY = this.inputY;

		this.x = this.inputX;
		this.y = this.inputY;
	}

}


