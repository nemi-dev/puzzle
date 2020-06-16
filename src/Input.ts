/**
 * 전적으로 rAF-Sync를 위해 표현되는 위치 객체로, 현재 rAF에서의 위치와 직전 rAF에서의 위치를 나타낸다.  
 * 직전 "이벤트"의 위치가 아닌 직전 "rAF"인 것에 주의할 것!
 * */
export class CoordState {

	/*
	 * DOM 이벤트가 발생했을 때 임시적으로 캡쳐한 마우스/손가락 위치  
	 * 이것은 이동, 누름, 놓음 모든 종류의 이벤트를 받아들인다
	 * Listener가 마우스 좌표를 받아들이면 퍼즐 조각에 바로 반영하지 않고, requestAnimationFrame이 돌아올 때까지 기다린다. (이벤트 핸들링이 rAF보다 훨씬 많이 발생한다.)  
	 * 따라서 쏟아지는 이벤트로 인해 불필요하게 성능이 저하되는 것을 방지한다.  
	 * 어떤 이벤트 루프에서 rAF가 발생하지 않으면 해당 루프로 받아들인 좌표는 버려지게 된다.
	 * */

	/** 임시적으로 캡쳐한 입력 X좌표 */
	private inputX : number
	/** 임시적으로 캡쳐한 입력 Y좌표 */
	private inputY : number

	/*
	 * inputX, inputY는 드래그를 하는 한에서는 현재 위치로 사용될 수 있으나,
	 * 드래그, 터치 스와이프를 하지 않는 동안에는 마지막으로 마우스 이벤트가 일어난 지점이 계속 저장되어 있다.
	 * 게다가 update()에서 dispatch와 pulse는 마우스 눌림 여부와 관계없이 항상 실행된다.
	 * 따라서 inputX, inputY는 "현재"를 나타내기에는 부적절하고, "현재 값"을 나타내기 위한 또 다른 속성이 필요하다.
	*/
	/** "현재" X좌표 */
	private currentX : number
	/** "현재" Y좌표 */
	private currentY : number

	/** 직전 rAF에서 X좌표 */
	private _beforeX : number
	/** 직전 rAF에서 y좌표 */
	private _beforeY : number

	/** @readonly 현재 x좌표 */
	get x() { return this.currentX }
	/** @readonly 현재 y좌표 */
	get y() { return this.currentY }

	/** @readonly 직전 rAF에서 X좌표 */
	get beforeX() { return this._beforeX }
	/** @readonly 직전 rAF에서 y좌표 */
	get beforeY() { return this._beforeY }

	/** @readonly 직전 rAF에서 현재 rAF까지의 x 변위 */
	get moveX() {
		return (this.beforeX != null) && (this.currentX != null)? (this.currentX - this._beforeX) : 0;
	}
	/** @readonly 직전 rAF에서 현재 rAF까지의 y 변위 */
	get moveY() {
		return (this.beforeY != null) && (this.currentY != null)? (this.currentY - this._beforeY) : 0;
	}

	/** 쌩 입력값을 이것으로 한다. */
	input(x : number, y : number) {
		this.inputX = x;
		this.inputY = y;
	}

	/** (눌림을 위해) current값을 강제로 이것으로 한다. */
	shim(x : number, y : number) {
		this.currentX = x;
		this.currentY = y;
	}

	/** 현재 상태를 이전 상태로, 쌩 입력 좌표를 현재 상태로 전이시킨다. */
	pulse() : void {
		this._beforeX = this.currentX;
		this._beforeY = this.currentY;
		
		this.currentX = this.inputX;
		this.currentY = this.inputY;
	}
}

/** 입력 인터페이스를 눈치껏 알아채는 객체 */
export class Detector {

	private source : HTMLElement;
	public event : MouseEvent | TouchEvent;

	private disconnect() {
		this.source.removeEventListener('mousedown', this.mouse);
		this.source.removeEventListener('touchstart', this.touch);
	}

	private mouse : (ev : MouseEvent) => void
	private touch : (ev : TouchEvent) => void

	getInterface(source : HTMLElement) : Promise<"mouse" | "touch"> {
		this.source = source;
		return new Promise((a, b) => {
			this.mouse = ev => {
				ev.preventDefault();
				this.disconnect();
				this.event = ev;
				a("mouse");
			};
			this.touch = ev => {
				ev.preventDefault();
				this.disconnect();
				this.event = ev;
				a("touch");
			}
			this.source.addEventListener('mousedown', this.mouse);
			this.source.addEventListener('touchstart', this.touch);
		});
	}

}

/**
 * 마우스 입력을 받아들여서 리스너에게 전달하는 클래스  
 * 이 클래스는 requestAnimationFrame()을 사용한 업데이트 패턴에 특화된 구조를 가지고 있다.  
 * 중요하고 양이 비교적 적은 이벤트(마우스 누름, 마우스 놓음)는 매 이벤트 루프마다 놓치지 않고 캡쳐해 두고, 압도적으로 많이 발생하고 중요하지 않은 이벤트(마우스 움직임)는 변화에 따라 "현재 상태"와 "직전 상태"만을 저장해 두고 rAF에서 그 상태를 참조하도록 하고 있다.  
 * 이 입력 객체는 특히 "마우스를 누를 때"에만 실제 좌표를 전달한다.
 */
export class MouseInput {

	/** 이벤트를 발생시키는 HTML 엘리먼트 */
	private source : HTMLElement

	/**
	 * 발생한 이벤트를 실제로 처리할 어떤 모델 또는 객체
	 * 
	 * 리스너를 여러 개로 만들려면 다음 중 하나는 해야 한다.
	 * 
	 * - 리스너가 독자적인 큐를 갖도록 하기
	 * - acceptCoordinate를 없애기
	 * */
	private listener : MouseInputListener

	/** 중요 이벤트(마우스 누름, 마우스 놓음)를 저장한 큐 */
	private readonly messageQueue : CoordMessage[] = []

	/**
	 * 마우스 누름 발생 시, 언젠가 발생할 마우스 떼기에 대응하여 임시로 메시지를 만들어 저장해 둘 배열
	 * messagePool[n]은 n번 마우스 버튼 누름에 대응하는 임시 마우스 떼기 메시지이다.
	 * n번 마우스 버튼 떼기가 발생하면 messagePool[n]에 있는 메시지를 꺼내서 end 값을 입력하고 큐에 넣는다.
	 * */
	private readonly messageCache : CoordMessage[] = [];

	/** 어떤 컨트롤(특히 뷰 기반 컨트롤)에 "배율이 설정"되었고, 리스너에게 모델 좌표계 기반으로 메시지를 보내고 싶을 때 모든 이벤트에 이 값이 곱해진다. */
	scale : number = 1

	/** rAF 발생 당시 마우스 누름 중일 때 사용할 수 있는 좌표 컴포넌트 */
	public readonly coordinate = new CoordState();

	
	/**
	 * 입력을 받아들였을 때 실행할 메서드  
	 * 유독 이 녀석이 public인 이유는 디텍터가 받은 첫 번째 이벤트를 버리지 않고 실제 미들웨어에게 전달하기 위함이었는데... 그냥 원본 함수를 노출시키는게 나았다. 원상복구하기 귀찮음
	 */
	public onstart(x : number, y : number, t : DOMHighResTimeStamp, id : number) {

		if (this.listener.acceptCoordinate(x, y)) {

			// pulse를 맞으면 currentX는 beforeX가 된다.
			// 따라서 rAF가 발생하는 시점에서 이전 위치는 마우스 누름 위치로 간주된다.
			this.coordinate.shim(x, y);

			// 이것과 rAF 사이에 move가 발생하지 않으면 rAF 발생 시 혀재 위치 또한 마우스 누름 위치가 된다.
			// rAF 발생 전에 move가 먼저 발생하면 input값을 덮어써서 걔들이 current값이 되겠지?
			this.coordinate.input(x, y);
			
			this.source.addEventListener('mousemove', this.mousemove);
			document.addEventListener('mouseup', this.mouseup);

			// 마우스 누름 이벤트를 입력한다.
			this.messageQueue.push({
				type : "mousedown",
				id,
				startX : x,
				startY : y,
				startTime : t
			});

			// down-up pair를 위해 마우스 누름 위치를 저장한다.
			this.messageCache[id] = {
				type : "mouseup",
				id,
				startX : x,
				startY : y,
				startTime : t
			};
		}
	}

	private mousedown = (ev : MouseEvent) => {
		ev.preventDefault();

		let x = ev.offsetX * this.scale;
		let y = ev.offsetY * this.scale;
		this.onstart(x, y, ev.timeStamp, ev.button);

		return false;
	}

	public invokeStart(ev : MouseEvent) {
		this.mousedown(ev);
	}

	private mousemove = (ev : MouseEvent) => {
		this.coordinate.input(ev.offsetX * this.scale, ev.offsetY * this.scale);
	}

	private mouseup = (ev : MouseEvent) => {
		/* MouseEvent.offsetX는 source 상대 위치이다. 띠용! */
		let x = ev.offsetX * this.scale;
		let y = ev.offsetY * this.scale;

		// 마우스 누름 당시 저장했던 마우스 놓기 메시지를 가져온다.
		let message = this.messageCache[ev.button];
		delete this.messageCache[ev.button];

		// 임시 메시지에 실제 마우스 놓기 데이터를 입력하여 메시지를 완성시킨다.
		message.endX = x;
		message.endY = y;
		message.endTime = ev.timeStamp;

		// 메시지를 큐에 입력한다.
		this.messageQueue.push(message);
		
		// 현재 rAF의 마우스 위치를 떼기 위치로 간주한다.
		// input에다 좌표를 넣어두면 rAF 발생 시 current로 내려가겠지?
		this.coordinate.input(x, y);

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
	 * # 중요 : 메시지 큐, 메시지 버퍼에 쌓인 것들은 rAF와 독립적으로 발생한 것들이다. 따라서 메시지는 coordState와는 좆도 상관없다.
	 * */
	update() {
		let message : CoordMessage;
		while ((message = this.messageQueue.shift()) != null) {
			switch (message.type) {
				case "mousedown":
					this.listener.dispatchMousedown(message);
					break;
				case "mouseup":
					this.listener.dispatchMouseup(message);
					break;
			}
		}
		this.coordinate.pulse();
	}

}





export class TouchInput {
	private source : HTMLElement
	private sourceLeft : number
	private sourceTop : number

	private listener : TouchInputListener

	private readonly messageQueue : CoordMessage[] = []
	private readonly messageCache : CoordMessage[] = []

	private readonly touchStateMap : CoordState[] = []

	private coord : CoordState = null;

	get coordinate() { return this.coord };

	scale : number = 1

	/**
	 * 입력을 받아들였을 때 실행할 메서드  
	 * 마우스 입력 미들웨어의 것과 같으나 이것은 터치 하나에 대해서만 처리한다는 특징이 있다.  
	 * 디텍터가 알아서 루프를 돌리거나 하겠지.. 
	 */
	public onstart(x : number, y : number, t : DOMHighResTimeStamp, id : number) {

		if (this.listener.acceptCoordinate(x, y)) {
			let state = new CoordState();
			state.input(x, y);
			state.shim(x, y);
			this.touchStateMap[id] = state;

			if (!this.coord) this.coord = state;

			this.messageQueue.push({
				type : "touchstart",
				id,
				startX : x,
				startY : y,
				startTime : t
			});

			this.messageCache[id] = {
				type : "touchend",
				id,
				startX : x,
				startY : y,
				startTime : t
			}
		}
		
	}
	
	private touchstart = (ev : TouchEvent) => {
		// 이게 없을 때 캔버스를 스와이프하면 페이지가 스크롤되고 탭을 하면 일부 환경에서 mouseup,mousedown을 일으킨다.
		ev.preventDefault();

		let touchList = ev.changedTouches;
		for (const touch of touchList) {
			let x = (touch.pageX - this.sourceLeft) * this.scale;
			let y = (touch.pageY - this.sourceTop) * this.scale;
			this.onstart(x, y, ev.timeStamp, touch.identifier);
		}

		return false;
	}

	
	public invokeStart(ev : TouchEvent) {
		this.touchstart(ev);
	}

	private touchmove = (ev : TouchEvent) => {
		for (const touch of ev.changedTouches) {
			if (touch.identifier in this.touchStateMap)	{
				const state = this.touchStateMap[touch.identifier];
				let x = (touch.pageX - this.sourceLeft) * this.scale;
				let y = (touch.pageY - this.sourceTop) * this.scale;
				state.input(x, y);
			}
		}
	}

	private touchend = (ev : TouchEvent) => {
		for (const touch of ev.changedTouches) {
			if (touch.identifier in this.touchStateMap)	{
				const state = this.touchStateMap[touch.identifier];

				const x = (touch.pageX - this.sourceLeft) * this.scale;
				const y = (touch.pageY - this.sourceTop) * this.scale;

				const message = this.messageCache[touch.identifier];
				delete this.messageCache[touch.identifier];

				message.endX = x;
				message.endY = y;
				message.endTime = ev.timeStamp;

				this.messageQueue.push(message);

				state.input(x, y);

				delete this.touchStateMap[touch.identifier];
				// 메이저 터치가 빠졌으면 후계자를 찾는다.
				if (this.coord == state) {
					this.coord = null;
					for (const i in this.touchStateMap) {
						if (this.touchStateMap.hasOwnProperty(i)) {
							this.coord = this.touchStateMap[i];
							break;
						}
					}
				}
				
			}
		}
	}

	connect(source : HTMLElement, listener : TouchInputListener) {
		this.disconnect();
		this.source = source;
		this.listener = listener;
		this.source.addEventListener('touchstart', this.touchstart);
		this.source.addEventListener('touchmove', this.touchmove);
		document.addEventListener('touchend', this.touchend);
		let { left, top } = source.getBoundingClientRect();
		this.sourceLeft = left;
		this.sourceTop = top;
	}

	disconnect() {
		let source = this.source;
		if (source) {
			source.removeEventListener('touchstart', this.touchstart);
			source.removeEventListener('touchmove', this.touchmove);
			document.removeEventListener('touchend', this.touchend);
		}
		this.source = null;
		this.listener = null;
	}

	update() {
		let message : CoordMessage;
		while ((message = this.messageQueue.shift()) != null) {
			switch (message.type) {
				case "touchstart":
					this.listener.dispatchTouchstart(message);
					break;
				case "touchend":
					this.listener.dispatchTouchend(message);
					break;
			}
		}
		for (const i in this.touchStateMap) {
			if (this.touchStateMap.hasOwnProperty(i)) {
				const state = this.touchStateMap[i];
				state.pulse();
			}
		}
	}
}
