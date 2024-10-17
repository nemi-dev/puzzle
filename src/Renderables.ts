import Game from "./Game";

export interface Renderable {
	update(game : Game) : void
	render(context : CanvasRenderingContext2D) : void
	readonly invalid : boolean
}

const uniformLife = 20;
const uniformParticleSpeed = 20;

const gravity = 0.75;
const airResist = 0.125;

const sparkHueStart = 50;
const sparkHueEnd = 15;

const sparkLumStart = 50;
const sparkLumEnd = 25;

const sparkAlphaStart = 1.0;
const sparkAlphaEnd = 0;

function getSprakStyle(life : number) {
	let p = 1 - life / uniformLife;
	let h = sparkHueStart + (sparkHueEnd - sparkHueStart) * p;
	let v = sparkLumStart + (sparkLumEnd - sparkLumStart) * p;
	let a = sparkAlphaStart + (sparkAlphaEnd - sparkAlphaStart) * p;
	return `hsl(${h}, 100%, ${v}%, ${a})`;
}

interface Particle {
	x : number
	y : number
	velX : number
	velY : number
}

export class Spark implements Renderable {

	/** 이 스파크의 수명 */
	private life : number = uniformLife

	/** 불꽃들 */
	private particles : Particle[]

	/** 스파크의 왼쪽 끝 */
	private x : number

	/** 스파크의 위쪽 끝 */
	private y : number

	/** 스파크의 길이 */
	private len : number

	/**
	 * 충돌이 발생한 축
	 * "h"이면 조각이 죄우 이동 중 충돌했단 것이고, 따라서 수직 방향으로 파이어볼이 생기고 수평 방향으로 스파크가 튄다.
	 */
	private axis : "h" | "v"

	/**
	 * 스파크가 튀는 방향
	 * -1이면 왼쪽 또는 위로, 1이면 오른쪽 또는 아래로 튄다.
	 * */
	private direction : number

	constructor(x : number, y : number, len : number, axis : "h" | "v", direction : number) {
		this.x = x;
		this.y = y;
		this.len = len;
		this.axis = axis;
		this.direction = direction;
		const particleCount = Math.floor(len / 10);
		let [eVelX, eVelY] = axis == "h"? [direction * uniformParticleSpeed, 0] : [0, direction * uniformParticleSpeed];
		this.particles = Array.from(Array(particleCount), () => {
			let relPos = Math.random() * len;
			let [_x, _y] = axis == "h"? [x + direction * uniformParticleSpeed, y + relPos] : [x + relPos, y + direction * uniformParticleSpeed];
			let velX : number;
			let velY : number;
			if (axis == "h") {
				velX = eVelX + (Math.random() - 0.5) * uniformParticleSpeed * 1.5;
				velY = eVelY + (relPos - len / 2) / 5;
			} else {
				velX = eVelX + (relPos - len / 2) / 5;
				velY = eVelY + (Math.random() - 0.5) * uniformParticleSpeed * 1.5;
			}
			return { x : _x, y : _y, velX, velY };
		});
		
	}

	update(game: Game): void {
		for (const particle of this.particles) {
			particle.x += particle.velX;
			particle.y += particle.velY;
			particle.velY += gravity;
			particle.velX -= Math.sign(particle.velX) * airResist;
		}
		this.life--;
	}

	/** 불똥을 그린다. */
	private renderParticles(context : CanvasRenderingContext2D) {
		const tempStroke = context.strokeStyle;
		const tmpLineCap = context.lineCap;

		context.strokeStyle = getSprakStyle(this.life);
		context.lineWidth = 5;
		context.lineCap = 'round';

		for (const particle of this.particles) {
			const { x, y, velX, velY } = particle;
			context.beginPath();
			context.moveTo(x, y);
			context.lineTo(x - velX * 2, y - velY * 2);
			context.stroke();
		}

		context.strokeStyle = tempStroke;
		context.lineCap = tmpLineCap
	}

	/** 파이어볼을 그린다. */
	private renderFireball(context: CanvasRenderingContext2D) {

		const tmpFillStyle = context.fillStyle;

		
		let x = this.x;
		let y = this.y;
		let p = Math.abs(this.life / uniformLife);
		let width = p * p * this.direction * this.len / 4;

		let g : CanvasGradient = (this.axis == "h")?  context.createLinearGradient(x + width, y, x, y) :
		context.createLinearGradient(x, y + width, x, y);

		g.addColorStop(0, "#000000");
		g.addColorStop(0.3, "#884310");
		g.addColorStop(0.7, "#FFCE58");
		g.addColorStop(1.0, "#FFFFFF");
		context.fillStyle = g;
		
		if (this.axis == "h") context.fillRect(x, y, width, this.len);
		else context.fillRect(x, y, this.len, width);

		context.fillStyle = tmpFillStyle;
	}


	/** 이 스파크에 대한 모든 것을 그린다. */
	render(context: CanvasRenderingContext2D): void {
		context.globalCompositeOperation = "screen";

		this.renderParticles(context);
		this.renderFireball(context);

		context.globalCompositeOperation = "source-over";
	}
	
	get invalid() { return this.life < 0; }
	
}


const uniformFlashLife = 70;
export class Flashbang implements Renderable {
	private life = uniformFlashLife;
	update(game: Game): void {
		throw new Error("Method not implemented.");
	}
	render(context: CanvasRenderingContext2D): void {
		throw new Error("Method not implemented.");
	}
	invalid: boolean;

}
