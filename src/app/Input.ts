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
	 * 처음에는 이벤트가 rAF보다 많이 발생할 것이라 예상하고 추가한 속성이었으나, 실제 프레임 생명주기는 이벤트와 rAF를 같은 사이클 내에 처리한다.
	 * 이제 이 클래스에 남겨진 실질적 기능이라고는 누름과 놓음에 대해 적극적으로 대응하는 기능, MouseEvent와 TouchEvent를 거의 동일한 수준으로 추상화시키는 기능뿐이다.
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

/**
 * 마우스 입력을 받아들여서 리스너에게 전달하는 클래스. 이 클래스의 목표 중 하나는 터치 인터페이스와 매우 흡사한 수준의 마우스 입력 처리를 수행하는 것이다.  
 * 이 클래스는 requestAnimationFrame()을 사용한 업데이트 패턴에 특화된 구조를 가지고 있다.  
 * 
 * 실제 rAF와 마우스 움직임 이벤트 처리는 같은 사이클에서 일어난다. 그런데 한 사이클에서 다른 종류의 이벤트가 발생할 수 있기 때문에 어떤 이벤트가 먼저 발생했는지를 추적하기 위한 큐를 가지고 있다. 물론 DOM 표준으로도 이벤트를 들어온 순서대로 처리하겠지만, 이 클래스는 마우스/터치 이벤트를 거의 비슷한 수준으로 추상화한 메시지를 큐에 보관한다.
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
	private readonly messageCache : PointMessage[] = [];

	/** 어떤 컨트롤(특히 뷰 기반 컨트롤)에 "배율이 설정"되었고, 리스너에게 모델 좌표계 기반으로 메시지를 보내고 싶을 때 모든 이벤트에 이 값이 곱해진다. */
	private scale : number

	/** rAF 발생 당시 마우스 누름 중일 때 사용할 수 있는 좌표 컴포넌트 */
	public readonly coordinate = new CoordinateState();

	/** 마우스 누름 이벤트 발생 시 실행된다.  */
	private readonly start = (ev : MouseEvent) => {
		ev.preventDefault();

		let startX = ev.offsetX * this.scale;
		let startY = ev.offsetY * this.scale;
		let id = ev.button;
		let startTime = ev.timeStamp;

		// 현재 위치와 이전 위치를 마우스/터치 누름 위치로 한다.
		this.coordinate.shim(startX, startY);
		this.coordinate.input(startX, startY);

		this.listener.push({ type : "mousedown", id, startX, startY, startTime });
		
		// down-up pair를 위해 마우스 누름 위치를 저장한다.
		this.messageCache[id] = { type : "mouseup", id, startX, startY, startTime };

		return false;
	}

	private readonly move = (ev : MouseEvent) => {
		this.coordinate.input(ev.offsetX * this.scale, ev.offsetY * this.scale);
	}

	private readonly end = (ev : MouseEvent) => {
		// 마우스/터치 놓기 이벤트는 모두 버블 가능하므로 리스너가 도큐먼트이면 실제로 마우스 놓음이 발생한 엘리먼트가 타겟이 된다. 그리고 오프셋 값도 실제 타겟을 기반으로 결정된다.
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
			this.coordinate.input(x, y);
		}
		

	}

	/** 입력 컴포넌트를 뷰에 연결한다. */
	connect (source : HTMLElement, listener : Listener, scale = 1) {
		this.disconnect();
		this.source = source;
		this.listener = listener;
		this.scale = scale;
		source.addEventListener('mousedown', this.start);
		source.addEventListener('mousemove', this.move);
		document.addEventListener('mouseup', this.end);
	}

	/** 입력 컴포넌트 연결을 해제한다. */
	disconnect () {
		let source = this.source;
		if (source) {
			source.removeEventListener('mousedown', this.start);
			source.removeEventListener('mousemove', this.move);
			document.removeEventListener('mouseup', this.end);
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

	private readonly messageCache : PointMessage[] = []

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
	
	private readonly start = (ev : TouchEvent) => {
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

	private readonly move = (ev : TouchEvent) => {
		for (const touch of ev.changedTouches) {
			if (touch.identifier in this.touchStateMap)	{
				const state = this.touchStateMap[touch.identifier];
				let x = (touch.pageX - this.sourceLeft) * this.scale;
				let y = (touch.pageY - this.sourceTop) * this.scale;
				state.input(x, y);
			}
		}
	}

	private readonly end = (ev : TouchEvent) => {
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
		this.source.addEventListener('touchstart', this.start);
		this.source.addEventListener('touchmove', this.move);
		document.addEventListener('touchend', this.end);
		let { left, top } = source.getBoundingClientRect();
		this.sourceLeft = left;
		this.sourceTop = top;
	}

	disconnect() {
		let source = this.source;
		if (source) {
			source.removeEventListener('touchstart', this.start);
			source.removeEventListener('touchmove', this.move);
			document.removeEventListener('touchend', this.end);
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
