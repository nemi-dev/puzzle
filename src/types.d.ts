declare interface PuzzleSetData {
	title : string
	img : string
	story : string
	left : number
	top : number
	size : number
	solvable : boolean
}

declare interface Physical {
	size? : number

	x? : number
	y? : number

	velX? : number
	velY? : number
}

declare interface MouseInputMessage {
	type : "mousedown" | "mouseup"

	startX? : number
	startY? : number
	startTime? : DOMHighResTimeStamp

	endX? : number
	endY? : number
	endTime? : DOMHighResTimeStamp
}


declare interface MouseInputListener {
	acceptCoordinate(x : number, y : number) : boolean
	dispatchMousedown(m : MouseInputMessage) : void
	dispatchMouseup(m : MouseInputMessage) : void	
}

