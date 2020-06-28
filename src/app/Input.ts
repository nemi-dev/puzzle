/*
 리스너를 여러 개로 만들려면 다음 중 하나는 해야 한다.
 
 - 리스너가 독자적인 큐를 갖도록 하기  
 중앙 집중적 큐를 사용하는 이유는 메시지 우선(메시지 1을 리스너 1에게 디스패치, 메시지 1을 리스너 2에게 디스패치, ...)으로 업데이트하기 위함이다.
 리스너 중심으로 메시지를 직접 처리하는 것보다 상태 전이가 더 용이할 수 있기 때문 (아닐 수도 있고. 이건 정말로 use-cases에 따라 다르다.)
 그러나 이렇게 하면서도 acceptCoordinate까지 쓰려면 어떤 리스너들에 대해서는 메시지를 스킵해야 한다. 어떤 입력에 대해서 리스너가 받아들일수도, 안받아들일수도 있기 때문. 그러려면 또다시 받아들일 것인지 말것인지 여부를 판단해야 하는데 그냥 독자적 큐를 쓰는게 낫지.
 
 acceptCoordinate를 썼던 이유는 
 1. 미들웨어가 클릭한 채로 드래그를 중요시하는 경우에 마우스를 클릭하지 않고 움직이는 것으로 인해 발생하는 이벤트를 무시하기 위하여 리스너를 동적으로 연결/연결 해제하기 위함이다.  
 2. 모델의 요구사항이다. 이거는 모델 선에서 처리해야지 씹놈아  
 
 터치 인터페이스인 경우에는 그 특성상 리스너를 굳이 연결 해제할 필요가 없다.
 
 그래서 acceptCoordinate를 모델 책임으로 넘겼고, 리스너가 독자적 큐를 갖도록 했다! 원한다면 리스너를 여러 개로 만들 수 있다
 
 ### 참고
 push와 dispatch가 별개인 이유는 순전히 이것이 rAF 중심적으로 설계되었고, 모든 상태 변경은 rAF에서만 허용한다고 가정하기 때문이다. dispatch는 rAF 중에만, push는 이벤트가 발생할 수 있는 어떠한 타이밍에서든지 일어날 수 있다. 아직까지는 rAF에서 메시지 dispatch를 먼저 실행하고 실질적 모델 업데이트를 하기 때문에 그게 그거같아 보이지만, 모델 업데이트를 먼저 하도록 바꾸는 것도 가능하다. 그럼 coord도 마저 바꿔야되는데 어 시발 이게 뭐지?
*/
/**
 * 전적으로 rAF-Sync를 위해 표현되는 위치 객체로, 현재 rAF에서의 위치와 직전 rAF에서의 위치를 나타낸다.  
 * 직전 "이벤트"의 위치가 아닌 직전 "rAF"인 것에 주의할 것!
 * */
export class CoordinateState {

	/*
	 * DOM 이벤트가 발생했을 때 임시적으로 캡쳐한 위치  
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

	private disconnect() {
		document.removeEventListener('mousedown', this.mouse);
		document.removeEventListener('touchstart', this.touch);
	}

	private mouse : (ev : MouseEvent) => void
	private touch : (ev : TouchEvent) => void

	public whenItsMouse : (ev : MouseEvent) => void
	public whenItsTouch : (ev : TouchEvent) => void

	open() {
		this.mouse = ev => {
			this.whenItsMouse(ev);
			this.disconnect();
		};
		this.touch = ev => {
			this.whenItsTouch(ev);
			this.disconnect();
		}
		document.addEventListener('mousedown', this.mouse);
		document.addEventListener('touchstart', this.touch, {passive : false});
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

	/** 입력을 받아들이는 어떤 모델 */
	private listener : Listener

	/** 중요 이벤트(마우스 누름, 마우스 놓음)를 저장한 큐 */

	/**
	 * 마우스 누름 발생 시, 언젠가 발생할 마우스 떼기에 대응하여 임시로 메시지를 만들어 저장해 둘 배열
	 * messagePool[n]은 n번 마우스 버튼 누름에 대응하는 임시 마우스 떼기 메시지이다.
	 * n번 마우스 버튼 떼기가 발생하면 messagePool[n]에 있는 메시지를 꺼내서 end 값을 입력하고 큐에 넣는다.
	 * */
	private readonly messageCache : CoordMessage[] = [];

	/** 어떤 컨트롤(특히 뷰 기반 컨트롤)에 "배율이 설정"되었고, 리스너에게 모델 좌표계 기반으로 메시지를 보내고 싶을 때 모든 이벤트에 이 값이 곱해진다. */
	private scale : number

	/** rAF 발생 당시 마우스 누름 중일 때 사용할 수 있는 좌표 컴포넌트 */
	public readonly coordinate = new CoordinateState();

	/** 마우스 누름 이벤트 발생 시 실행된다.  */
	public readonly onstart = (ev : MouseEvent) => {
		ev.preventDefault();

		let startX = ev.offsetX * this.scale;
		let startY = ev.offsetY * this.scale;
		let id = ev.button;
		let startTime = ev.timeStamp;

		// pulse를 맞으면 currentX는 beforeX가 된다.
		// 따라서 rAF가 발생하는 시점에서 이전 위치는 마우스 누름 위치로 간주된다.
		this.coordinate.shim(startX, startY);

		// 이것과 rAF 사이에 move가 발생하지 않으면 rAF 발생 시 혀재 위치 또한 마우스 누름 위치가 된다.
		// rAF 발생 전에 move가 먼저 발생하면 input값을 덮어써서 걔들이 current값이 되겠지?
		this.coordinate.input(startX, startY);

		this.listener.push({ type : "mousedown", id, startX, startY, startTime });
		
		// down-up pair를 위해 마우스 누름 위치를 저장한다.
		this.messageCache[id] = { type : "mouseup", id, startX, startY, startTime };

		return false;
	}

	public readonly onmove = (ev : MouseEvent) => {
		this.coordinate.input(ev.offsetX * this.scale, ev.offsetY * this.scale);
	}

	public readonly onend = (ev : MouseEvent) => {
		/* MouseEvent.offsetX는 source 상대 위치이다. 띠용! */
		let x = ev.offsetX * this.scale;
		let y = ev.offsetY * this.scale;

		// 마우스 누름 당시 저장했던 마우스 놓기 메시지를 가져온다.
		let message = this.messageCache[ev.button];
		delete this.messageCache[ev.button];

		if (message) {
			// 임시 메시지에 실제 마우스 놓기 데이터를 입력하여 메시지를 완성시킨다.
			message.endX = x;
			message.endY = y;
			message.endTime = ev.timeStamp;

			// 메시지를 큐에 입력한다.
			this.listener.push(message);

			// 현재 rAF의 마우스 위치를 떼기 위치로 간주한다.
			// input에다 좌표를 넣어두면 rAF 발생 시 current로 내려가겠지?
			this.coordinate.input(x, y);
		}
		

	}

	/** 입력 컴포넌트를 뷰에 연결한다. */
	connect (source : HTMLElement, listener : Listener, scale = 1) {
		this.disconnect();
		this.source = source;
		this.listener = listener;
		this.scale = scale;
		this.source.addEventListener('mousedown', this.onstart);
		this.source.addEventListener('mousemove', this.onmove);
		document.addEventListener('mouseup', this.onend);
	}

	/** 입력 컴포넌트 연결을 해제한다. */
	disconnect () {
		let source = this.source;
		if (source) {
			source.removeEventListener('mousedown', this.onstart);
			source.removeEventListener('mousemove', this.onmove);
			document.removeEventListener('mouseup', this.onend);
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
		this.listener.dispatchAll();
		this.coordinate.pulse();
	}

}





export class TouchInput {
	private source : HTMLElement

	/** Touch 객체는 offsetX를 가지고 있지 않다. 결국 pageX를 써야 한다는 것인데, 입력을 받아들이는 엘리먼트의 왼쪽 위를 기준으로 하려면 추가적으로 엘리먼트의 좌표를 알고 있어야 한다. 또한, 이 값들은 입력 객체 연결 시에만 초기화되기 때문에 연결 후에 엘리먼트의 위치가 바뀌지 않는다는 가정도 포함되어 있다. 엘리먼트의 위치가 바뀌어도 입력 위치가 적절히 조율되도록 하려면 이 속성들을 빼고 거의 모든 이벤트 핸들러에서 getBoundingClientRect()를 사용하애 한다. 아니면 위치가 바뀌는걸 눈치껏 알아채는 방법을 쓰든가... */
	private sourceLeft : number
	private sourceTop : number

	private listener : Listener

	private readonly messageCache : CoordMessage[] = []

	/**
	 * 마우스는 항상 하나의 좌표지만 터치는 언제 어디서 어떤 터치가 생길지, 없어질지 모른다.
	 * 근데 메인 터치는 있어야 하는 법이고, 갑자기 메인 터치가 없어지면 여기 있던 놈들 중에서 한 녀석이 메인 터치를 계승한다.
	 * */
	private readonly touchStateMap : CoordinateState[] = []

	/** @private 메인 터치의 위치 */
	private coord : CoordinateState = null;

	/** @readonly 메인 터치의 위치 */
	get coordinate() { return this.coord };

	scale : number = 1
	
	public readonly onstart = (ev : TouchEvent) => {
		// 이게 없을 때 캔버스를 스와이프하면 페이지가 스크롤되고 탭을 하면 일부 환경에서 mouseup,mousedown을 일으킨다.
		ev.preventDefault();

		const startTime = ev.timeStamp;
		let touchList = ev.changedTouches;

		for (const touch of touchList) {
			let startX = (touch.pageX - this.sourceLeft) * this.scale;
			let startY = (touch.pageY - this.sourceTop) * this.scale;
			let id = touch.identifier;

			let state = new CoordinateState();
			state.input(startX, startY);
			state.shim(startX, startY);
			this.touchStateMap[id] = state;

			// 메인 터치가 없었다면 이 터치를 메인 터치로 설정한다.
			if (!this.coord) this.coord = state;

			this.listener.push({ type : "touchstart", id, startX, startY, startTime });
			this.messageCache[id] = { type : "touchend", id, startX, startY, startTime };

		}

		return false;
	}

	public readonly onmove = (ev : TouchEvent) => {
		for (const touch of ev.changedTouches) {
			if (touch.identifier in this.touchStateMap)	{
				const state = this.touchStateMap[touch.identifier];
				let x = (touch.pageX - this.sourceLeft) * this.scale;
				let y = (touch.pageY - this.sourceTop) * this.scale;
				state.input(x, y);
			}
		}
	}

	public readonly onend = (ev : TouchEvent) => {
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

				this.listener.push(message);

				state.input(x, y);

				// 놓은 위치의 터치 위치 상태를 뺀다.
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

	connect(source : HTMLElement, listener : Listener, scale = 1) {
		this.disconnect();
		this.source = source;
		this.listener = listener;
		this.scale = scale;
		this.source.addEventListener('touchstart', this.onstart);
		this.source.addEventListener('touchmove', this.onmove);
		document.addEventListener('touchend', this.onend);
		let { left, top } = source.getBoundingClientRect();
		this.sourceLeft = left;
		this.sourceTop = top;
	}

	disconnect() {
		let source = this.source;
		if (source) {
			source.removeEventListener('touchstart', this.onstart);
			source.removeEventListener('touchmove', this.onmove);
			document.removeEventListener('touchend', this.onend);
		}
		this.source = null;
		this.listener = null;
	}

	update() {
		this.listener.dispatchAll();
		for (const i in this.touchStateMap) {
			if (this.touchStateMap.hasOwnProperty(i)) {
				const state = this.touchStateMap[i];
				state.pulse();
			}
		}
	}
}
