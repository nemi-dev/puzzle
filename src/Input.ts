/**
 * 마우스 입력을 받아들여서 리스너에게 전달하는 클래스  
 * 이 클래스는 requestAnimationFrame()을 사용한 업데이트 패턴에 특화된 구조를 가지고 있다.  
 * 중요하고 양이 비교적 적은 이벤트(마우스 누름, 마우스 놓음)는 매 이벤트 루프마다 놓치지 않고 캡쳐해 두고, 압도적으로 많이 발생하고 중요하지 않은 이벤트(마우스 움직임)는 변화에 따라 "현재 상태"와 "직전 상태"만을 저장해 두고 rAF에서 그 상태를 참조하도록 하고 있다.
 */
export default class MouseInput {

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
	 * inputX, inputY는 드래그를 하는 한에서는 현재 위치로 사용될 수 있으나,
	 * 드래그를 하지 않는 동안에는 마지막으로 마우스 이벤트가 일어난 지점이 계속 저장되어 있다.
	 * 게다가 update()에서 dispatch와 pulse는 마우스 눌림 여부와 관계없이 항상 실행된다.
	 * 따라서 inputX, inputY는 "현재"를 나타내기에는 부적절하다.
	*/
	private currentX : number = null
	private currentY : number = null

	/** (private) 마지막 update(rAF)가 발생하기 직전의 마우스 위치 */
	private _beforeX : number = null
	private _beforeY : number = null

	/** 현재 마우스 위치 */
	get x() { return this.currentX }
	get y() { return this.currentY }

	/** 마지막 update(rAF)가 발생하기 직전의 마우스 위치 */
	get beforeX() { return this._beforeX }
	get beforeY() { return this._beforeY }

	/** update(rAF) 간의 x, y 변화량 */
	get moveX() {
		return (this.beforeX != null) && (this.currentX != null)? (this.currentX - this._beforeX) : 0;
	}
	get moveY() {
		return (this.beforeY != null) && (this.currentY != null)? (this.currentY - this._beforeY) : 0;
	}

	/**
	 * 마우스 누름 발생 시, 언젠가 발생할 마우스 떼기에 대응하여 임시로 메시지를 만들어 저장해 둘 배열
	 * messagePool[n]은 n번 마우스 버튼 누름에 대응하는 임시 마우스 떼기 메시지이다.
	 * n번 마우스 버튼 떼기가 발생하면 messagePool[n]에 있는 메시지를 꺼내서 end 값을 입력하고 큐에 넣는다.
	 * */
	private readonly messagePool : MouseInputMessage[] = [];


	private mousedown = (ev : MouseEvent) => {
		ev.preventDefault();
		
		// @todo : acceptCoordinate때문에 listener가 단 하나이어야 한다는 제약이 추가되었다
		if (this.listener.acceptCoordinate(ev.offsetX, ev.offsetY)) {

			// pulse를 맞으면 currentX는 beforeX가 된다.
			// 따라서 rAF가 발생하는 시점에서 이전 위치는 마우스 누름 위치로 간주된다.
			this.currentX = ev.offsetX;
			this.currentY = ev.offsetY;

			// 이것과 rAF 사이에 move가 발생하지 않으면 rAF 발생 시 혀재 위치 또한 마우스 누름 위치가 된다.
			// rAF 발생 전에 move가 먼저 발생하면 input값을 덮어써서 걔들이 current값이 되겠지?
			this.inputX = ev.offsetX;
			this.inputY = ev.offsetY;
			
			this.source.addEventListener('mousemove', this.mousemove);
			document.addEventListener('mouseup', this.mouseup);

			// 마우스 누름 이벤트를 입력한다.
			this.messages.push({
				type : "mousedown",
				startX : ev.offsetX,
				startY : ev.offsetY,
				startTime : ev.timeStamp
			});

			// down-up pair를 위해 마우스 누름 위치를 저장한다.
			this.messagePool[ev.button] = {
				type : "mouseup",
				startX : ev.offsetX,
				startY : ev.offsetY,
				startTime : ev.timeStamp
			};
		}

		return false;
	}

	private mousemove = (ev : MouseEvent) => {
		this.inputX = ev.offsetX;
		this.inputY = ev.offsetY;
	}

	private mouseup = (ev : MouseEvent) => {
		/* MouseEvent.offsetX는 source 상대 위치이다. 띠용! */
		
		let x = ev.offsetX;
		let y = ev.offsetY;

		// 마우스 누름 당시 저장했던 마우스 놓기 메시지를 가져온다.
		let message = this.messagePool[ev.button];
		delete this.messagePool[ev.button];

		// 임시 메시지에 실제 마우스 놓기 데이터를 입력하여 메시지를 완성시킨다.
		message.endX = x;
		message.endY = y;
		message.endTime = ev.timeStamp;

		// 메시지를 큐에 입력한다.
		this.messages.push(message);
		
		// 현재 rAF의 마우스 위치를 떼기 위치로 간주한다.
		// input에다 좌표를 넣어두면 rAF 발생 시 current로 내려가겠지?
		this.inputX = x;
		this.inputY = y;

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

	/**
	 * (rAF) 큐에 있는 메시지를 모두 정리하고, 상태를 전이시킨다.
	 * 
	 * # 중요 : 디스패치는 currentX|Y, beforeX|Y, moveX|Y와는 좆도 상관 없다고 씨발놈아!!
	 * */
	update() {

		// dispatch
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

		// pulse
		this._beforeX = this.currentX;
		this._beforeY = this.currentY;
		
		this.currentX = this.inputX;
		this.currentY = this.inputY;
	}

}


