declare interface Physical {
	size? : number

	x? : number
	y? : number

	velX? : number
	velY? : number
}

declare interface CoordMessage {
	type : "mousedown" | "mouseup" | "touchstart" | "touchend"

	id : number

	startX? : number
	startY? : number
	startTime? : DOMHighResTimeStamp

	endX? : number
	endY? : number
	endTime? : DOMHighResTimeStamp
}


declare interface MouseInputListener {
	acceptCoordinate(x : number, y : number) : boolean
	dispatchMousedown(m : CoordMessage) : void
	dispatchMouseup(m : CoordMessage) : void	
}

declare interface TouchInputListener {
	acceptCoordinate(x : number, y : number) : boolean
	dispatchTouchstart(m : CoordMessage) : void
	dispatchTouchend(m : CoordMessage) : void	
}

