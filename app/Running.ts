export default class Running {
	readonly update: Function;
	private running: boolean = false;
	private a: FrameRequestCallback = null;
	constructor(update : Function) {
		this.update = update;
	}
	start() {
		let _this = this;
		this.running = true;
		this.a = function (t) {
			_this.update();
			if (_this.running) {
				requestAnimationFrame(_this.a);
			}
		};
		requestAnimationFrame(this.a);
	}
	stop() {
		this.running = false;
		this.a = null;
	}
}
