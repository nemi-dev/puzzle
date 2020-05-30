export default class Clock {

	readonly update: (t? : number) => void;
	private running: boolean = false;
	private a: FrameRequestCallback = null;
	private id : number = null;
	constructor(update : (t? : number) => void) {
		this.update = update;
	}
	run() {
		this.running = true;
		this.a = (t) => {
			this.update(t);
			if (this.running) {
				this.id = requestAnimationFrame(this.a);
			}
		};
		this.id = requestAnimationFrame(this.a);
	}
	stop() {
		this.running = false;
		cancelAnimationFrame(this.id);
		this.a = null;
	}
}
