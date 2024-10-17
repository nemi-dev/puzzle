declare interface PointMessage {
	type : "mousedown" | "mouseup" | "touchstart" | "touchend"

	id : number

	startX? : number
	startY? : number
	startTime? : DOMHighResTimeStamp

	endX? : number
	endY? : number
	endTime? : DOMHighResTimeStamp
}

declare interface Listener {
	push(m : PointMessage) : void
	dispatchAll() : void
}

