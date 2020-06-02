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

	render (context : CanvasRenderingContext2D, left : number, len : number, y : number) {
		context.font = '42px "Exo 2"';
		let [min, sec, cs] = formatMs(this.currentTime - this.startTime);
		
		let d = len / 3;
		let p = len / 8;
		let q = d * 7 / 8;
		
		context.fillText(min, left + p, y);
		context.fillText(':', left + q, y);
		context.fillText(sec, left + d + p , y);
		context.fillText('\'', left + d + q , y);
		context.fillText(cs, left + d * 2 + p, y);
		context.fillText('"', left + d * 2 + q, y);
	}

}