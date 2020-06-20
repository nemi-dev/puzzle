export default class RAFPulseClock {

	update: FrameRequestCallback;

	private a: FrameRequestCallback = null;

	constructor(update? : FrameRequestCallback) {
		this.update = update;
	}

	start() {
		this.a = (t) => {
			this.update(t);
			requestAnimationFrame(this.a);
		};
		requestAnimationFrame(this.a);
	}

	end() {
		this.a = (t) => {
			this.a = null;
		};
	}

}
