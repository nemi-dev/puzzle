/**
 * DOM 이벤트를 이용하여 마우스 입력을 받아들이는 컴포넌트였는데요, 이제 독립 객체가 되었다.  
 * 이 클래스는 requestAnimationFrame()을 사용한 업데이트 패턴에 특화된 구조를 가지고 있다.  
 * 중요하고 양이 비교적 적은 이벤트(마우스 누름, 마우스 놓음)는 매 이벤트 루프마다 놓치지 않고 캡쳐해 두고, 압도적으로 많이 발생하고 중요하지 않은 이벤트(마우스 움직임)는 변화에 따라 "현재 상태"와 "직전 상태"만을 저장해 두고 rAF에서 그 상태를 참조하도록 하고 있다.
 */
export default class Input {

	/** 이벤트를 발생시키는 HTML 엘리먼트 */
	private source : HTMLElement;

	/** 발생한 이벤트를 실제로 처리할 어떤 모델 또는 객체 */
	private listener : MouseInputListener;

	/** 중요 이벤트(마우스 누름, 마우스 놓음)를 저장한 큐 */
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
		
		// @todo : acceptCoordinate때문에 listener가 단 하나이어야 한다는 제약이 추가되었다
		if (this.listener.acceptCoordinate(ev.offsetX, ev.offsetY)) {
			this.startX = ev.offsetX;
			this.startY = ev.offsetY;
			this.startTime = ev.timeStamp;
	
			this.inputX = this.startX;
			this.inputY = this.startY;

			/*
			@todo
				현재 Input의 mousemove는 "마우스를 누른 채로 움직일 때 실행된다"라고 정의하고 설계되었다.
				그에 따라 필연적으로 마우스가 눌리는 시점에서 이전의 _beforeX, _beforeY의 값을 무효화시켜야 한다.
				그런데 여기서 _before값을 무효화시키지 않는 다른 방법이 있을 것인가?
			*/
			this._beforeX = null;
			this._beforeY = null;
	
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

	/** (rAF) 큐에 있는 메시지를 모두 정리한다. */
	dispatch() {
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
	}

	/** (rAF) 현재 상태를 이전 상태로 저장해둔다. */
	pulse() {
		this._beforeX = this.inputX;
		this._beforeY = this.inputY;
	}

}


