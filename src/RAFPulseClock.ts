export default class RAFPulseClock {

	update: FrameRequestCallback;

	private running: boolean = false;

	private a: FrameRequestCallback = null;

	constructor(update : FrameRequestCallback) {
		this.update = update;
	}

	run() {
		this.running = true;
		this.a = (t) => {
			this.update(t);
			if (this.running) {
				requestAnimationFrame(this.a);
			}
		};
		requestAnimationFrame(this.a);
	}

	stop() {
		this.running = false;
		this.a = null;
	}

}
