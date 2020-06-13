export default class Physical {
	size : number

	x : number
	y : number

	velX : number
	velY : number

	/** 박스의 값을 주어진 박스의 값들로 한다. */
	apply(src : Physical) {
		this.x = src.x;
		this.y = src.y;
		this.velX = src.velX;
		this.velY = src.velY;

		// 아직까진 사이즈 다른 놈을 못 봤다.
		this.size = src.size;
	}
	
	/** 이 박스와 지정한 박스에 대해, 주어진 축에 대하여 **1차원 충돌**을 예측한다. */
	willHit(other : Physical, direction : "h" | "v") {
		if (this == other) return false;
		let thisStart : number;
		let thisEnd : number;
		let thatStart : number;
		let thatEnd : number;
		if (direction == "h") {
			thisStart = Math.min(this.x, this.x + this.velX);
			thisEnd = Math.max(this.x + this.size, this.x + this.size + this.velX);
			thatStart = Math.min(this.x, this.x + this.velX);
			thatEnd = Math.max(this.x + this.size, this.x + this.size + this.velX);
		} else if (direction == "v") {
			thisStart = Math.min(this.y, this.y + this.velY);
			thisEnd = Math.max(this.y + this.size, this.y + this.size + this.velY);
			thatStart = Math.min(this.y, this.y + this.velY);
			thatEnd = Math.max(this.y + this.size, this.y + this.size + this.velY);
		} else {
			return false;
		}
		return thisStart < thatEnd && thatStart < thisEnd;
	}


}
