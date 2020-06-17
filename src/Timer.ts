/** 마이크로초를 mm : ss . ss 로 나눈다. */
function formatMs(ms : number) {
	let val = Math.round(ms / 10);
	let min = Math.floor(val / 6000);
	let centisec = val % 6000;
	
	let centisec_str = centisec.toString();
	let centisec_len = centisec_str.length;

	if (centisec_len < 4) {
		let a = Array(4 - centisec_len);
		a.fill('0');
		centisec_str = a.join('') + centisec_str;
	}

	let min_str = min.toString();
	let min_len = min_str.length;

	if (min_len < 2) {
		let a = Array(2 - min_len);
		a.fill('0');
		min_str = a.join('') + min_str;
	}

	return [min_str, centisec_str.substr(0, 2), centisec_str.substr(2, 2)];

}

/**
 * 타이머 컴포넌트
 * DOMHighResTimestamp 때문에 로직이 은근 복잡하다.
 * */
export default class Timer {

	/** 폰트 픽셀크기 */
	fontSize : number

	/** y좌표 */
	y : number

	/** 왼쪽 끝 */
	left : number

	/** (margin을 제외한) 폭 */
	private _width : number

	/** 높이 */
	private _height : number

	/** 폭의 3분의 1 */
	private w_3 : number

	/** 폭의 6분의 1 */
	private w_6 : number

	/** 뷰를 3등분한 기준점에서 십의 자리 숫자를 그릴 오프셋  */
	private p : number

	/** 뷰를 3등분한 기준점에서 일의 자리 숫자를 그릴 오프셋  */
	private q : number

	set width (v : number) {
		this._width = v;
		this.w_3 = v / 3;
		this.w_6 = v / 6;
		this.p = this.w_6 - v / 25;
		this.q = this.w_6 + v / 25;
	}

	set height (v : number) {
		this._height = v;
		this.fontSize = v - 1;
	}

	constructor(left : number, width : number, height : number) {
		this.y = height / 2;
		this.left = left;
		this.width = width;
		this.height = height;
	}
	

	/** 시작 버튼을 누른 시각 */
	startTime : DOMHighResTimeStamp = null;

	/** 퍼즐이 중단된 시각 */
	endTime : DOMHighResTimeStamp = null;

	/** rAF에 의해 입력되는 시각 */
	currentTime : DOMHighResTimeStamp = 0;

	start(startTime : DOMHighResTimeStamp) {
		this.startTime = startTime;
		this.endTime = null;
	}

	end(endTime : DOMHighResTimeStamp) {
		this.endTime = endTime;
	}

	reset() {
		this.startTime = null;
		this.endTime = null;
		this.currentTime = null;
	}

	update (t : DOMHighResTimeStamp) {
		this.currentTime = t;
	}

	render (context : CanvasRenderingContext2D) {
		
		let { y, left, w_3, w_6, p, q } = this;
		
		context.clearRect(left, 0, this._width, this._height);
		context.font = this.fontSize + 'px "Exo 2"';
		
		let [min, sec, cs] = formatMs(this.currentTime - this.startTime);
		
		context.lineWidth = 4;

		context.textAlign = 'center';
		context.strokeText(min, left + w_6, y);
		context.strokeText('\'', left + w_3, y);
		context.strokeText('"', left + w_3 * 2 , y);
		context.fillText(min, left + w_6, y);
		context.fillText('\'', left + w_3, y);
		context.fillText('"', left + w_3 * 2 , y);

		context.textAlign = 'right';
		context.strokeText(sec[0], left + w_3 + w_6 , y);
		context.strokeText(cs[0], left + w_3 * 2 + w_6, y);
		context.fillText(sec[0], left + w_3 + w_6, y);
		context.fillText(cs[0], left + w_3 * 2 + w_6, y);

		context.textAlign = 'left';
		context.strokeText(sec[1], left + w_3 + w_6, y);
		context.strokeText(cs[1], left + w_3 * 2 + w_6, y);
		context.fillText(sec[1], left + w_3 + w_6, y);
		context.fillText(cs[1], left + w_3 * 2 + w_6, y);
		
	}

}