export default class Running {

	readonly update: Function;
	private running: boolean = false;
	private a: FrameRequestCallback = null;
	private id : number = null;
	constructor(update : Function) {
		this.update = update;
	}
	start() {
		this.running = true;
		this.a = (t) => {
			this.update();
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
