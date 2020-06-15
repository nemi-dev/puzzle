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
const sparkHueEnd = 25;

const sparkLumStart = 50;
const sparkLumEnd = 25;

const sparkAlphaStart = 1.0;
const sparkAlphaEnd = 0.5;

const fireballHueStart = 30;
const fireballHueEnd = -20;

const fireballLumStart = 90;
const fireballLumEnd = 0;

const fireballAlphaStart = 1.0;
const fireballAlphaEnd = -3.0;

function getFireballStyle(life : number) {
	let p = 1 - life / uniformLife;
	let h = fireballHueStart + (fireballHueEnd - fireballHueStart) * p;
	let v = fireballLumStart + (fireballLumEnd - fireballLumStart) * p;
	let a = fireballAlphaStart + (fireballAlphaEnd - fireballAlphaStart) * p;
	return `hsl(${h}, 100%, ${v}%, ${a})`;
}

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

	/** 파이어볼의 폭 */
	private width : number

	/**
	 * @param x 왼쪽 끝
	 * @param y 위쪽 끝
	 * @param len 길이
	 * @param axis 충돌이 발생한 축
	 * @param direction 스파크가 튀는 방향
	 */
	constructor(x : number, y : number, len : number, axis : "h" | "v", direction : number) {
		this.x = x;
		this.y = y;
		this.len = len;
		this.width = 8;
		this.axis = axis;
		this.direction = direction;
		let [eVelX, eVelY] = axis == "h"? [direction * uniformParticleSpeed, 0] : [0, direction * uniformParticleSpeed];
		this.particles = Array.from(Array(10), () => {
			let relPos = Math.random() * len;
			let [_x, _y] = axis == "h"? [x, y + relPos] : [x + relPos, y];
			let velX : number;
			let velY : number;
			if (axis == "h") {
				velX = eVelX + (Math.random() - 0.5) * uniformParticleSpeed * 1.5;
				velY = eVelY + (relPos - len / 2) / 6;
			} else {
				velX = eVelX + (relPos - len / 2) / 6;
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

	render(context: CanvasRenderingContext2D): void {
		const tempStroke = context.strokeStyle;
		context.strokeStyle = getSprakStyle(this.life);
		context.lineWidth = 3;
		context.globalCompositeOperation = "screen";

		for (const particle of this.particles) {
			const { x, y, velX, velY } = particle;
			context.beginPath();
			context.moveTo(x, y);
			context.lineTo(x - velX * 2, y - velY * 2);
			context.stroke();
		}
		
		context.strokeStyle = getFireballStyle(this.life);
		context.beginPath();
		context.moveTo(this.x, this.y);
		if (this.axis == "h") {
			context.lineTo(this.x, this.y + this.len);
		} else {
			context.lineTo(this.x + this.len, this.y);
		}
		context.stroke();

		context.globalCompositeOperation = "source-over";
		context.strokeStyle = tempStroke;
	}
	
	get invalid() { return this.life < 0; }
	
}

export class Flashbang implements Renderable {
	update(game: Game): void {
		throw new Error("Method not implemented.");
	}
	render(context: CanvasRenderingContext2D): void {
		throw new Error("Method not implemented.");
	}
	invalid: boolean;

}
