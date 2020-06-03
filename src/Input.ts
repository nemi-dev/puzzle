
/**
 * DOM 이벤트를 이용하여 마우스 입력을 받아들이는 컴포넌트
 * 이벤트 루프가 rAF보다 훨씬 빈번하게 일어나므로 입력값을 rAF-synchronize시키는 기능도 있다.
 */
export default class Input {

	private source : HTMLElement;
	private listener : MouseInputListener;
	private readonly messages : MouseInputMessage[] = [];

	/**
	 * DOM 이벤트가 발생했을 때 임시적으로 캡쳐한 마우스 위치  
	 * 이것은 이동, 누름, 놓음 모든 종류의 이벤트를 받아들인다
	 * Listener가 마우스 좌표를 받아들이면 퍼즐 조각에 바로 반영하지 않고, requestAnimationFrame이 돌아올 때까지 기다린다. (이벤트 핸들링이 rAF보다 훨씬 많이 발생한다.)  
	 * 따라서 쏟아지는 이벤트로 인해 불필요하게 성능이 저하되는 것을 방지한다.  
	 * 어떤 이벤트 루프에서 rAF가 발생하지 않으면 해당 루프로 받아들인 좌표는 버려지게 된다.
	 * */
	private inputX : number = null
	private inputY : number = null

	/**
	 * 현재 마우스 위치  
	 * rAF 동기화된 함수/메서드 내에서만 사용할 것
	 * */
	get x() { return this.inputX }
	get y() { return this.inputY }

	/** (private) 마지막 update(rAF)가 발생하기 직전의 마우스 위치 */
	private _beforeX : number = null
	private _beforeY : number = null

	/** 마지막 update(rAF)가 발생하기 직전의 마우스 위치 */
	get beforeX() { return this._beforeX }
	get beforeY() { return this._beforeY }

	/** update(rAF) 간의 beforeX, beforeY의 변화량 */
	get moveX() { return (this.beforeX != null)? (this.inputX - this._beforeX) : 0; }
	get moveY() { return (this.beforeY != null)? (this.inputY - this._beforeY) : 0; }

	/** 마우스 버튼을 누른 위치와 시각 */
	private startX : number = null
	private startY : number = null
	private startTime : number = null

	private mousedown = (ev : MouseEvent) => {
		ev.preventDefault();
		
		// todo : acceptCoordinate때문에 listener가 단 하나이어야 한다는 제약이 추가되었다
		if (this.listener.acceptCoordinate(ev.offsetX, ev.offsetY)) {
			this.startX = ev.offsetX;
			this.startY = ev.offsetY;
			this.startTime = ev.timeStamp;
	
			this.inputX = this.startX;
			this.inputY = this.startY;
	
			this.source.addEventListener('mousemove', this.mousemove);
			document.addEventListener('mouseup', this.mouseup);


			this.messages.push({
				type : "mousedown",
				x : ev.offsetX,
				y : ev.offsetY,
				t : ev.timeStamp,

				startX : ev.offsetX,
				startY : ev.offsetY,
				startTime : ev.timeStamp
			});
		}


		return false;
	}

	private mousemove = (ev : MouseEvent) => {
		this.inputX = ev.offsetX;
		this.inputY = ev.offsetY;
	}

	private mouseup = (ev : MouseEvent) => {

		this.messages.push({
			type : "mouseup",

			endX : ev.offsetX,
			endY : ev.offsetY,
			endTime : ev.timeStamp,

			startX : this.startX,
			startY : this.startY,
			startTime : this.startTime
		});
		this.source.removeEventListener('mousemove', this.mousemove);
		document.removeEventListener('mouseup', this.mouseup);

	}

	/** 입력 컴포넌트를 뷰에 연결한다. */
	connect (source : HTMLElement, listener : MouseInputListener) {
		this.disconnect();
		this.source = source;
		this.listener = listener;
		this.source.addEventListener('mousedown', this.mousedown);
	}

	/** 입력 컴포넌트 연결을 해제한다. */
	disconnect () {
		let source = this.source;
		if (source) {
			source.removeEventListener('mousedown', this.mousedown);
			source.removeEventListener('mousemove', this.mousemove);
			document.removeEventListener('mouseup', this.mouseup);
		}
		this.source = null;
		this.listener = null;
	}

	/** rAF */
	pulse() {
		let message : MouseInputMessage;
		while ((message = this.messages.shift()) != null) {
			switch (message.type) {
				case "mousedown":
					this.listener.dispatchMousedown(message);
					break;
				case "mouseup":
					this.listener.dispatchMouseup(message);
					break;
			}
		}
		this._beforeX = this.inputX;
		this._beforeY = this.inputY;
	}

}


