declare interface PuzzleSetData {
	title : string
	img : string
	story : string
	left : number
	top : number
	size : number
	solvable : boolean
}

/** (일단은) mouseup, mousedown에 대해서만 고려하도록 한다. */
declare interface MouseInputMessage {
	type : "mousedown" | "mouseup"

	startX? : number
	startY? : number
	startTime? : DOMHighResTimeStamp

	endX? : number
	endY? : number
	endTime? : DOMHighResTimeStamp

	x? : number
	y? : number
	t? : DOMHighResTimeStamp
}


declare interface MouseInputListener {
	acceptCoordinate(x : number, y : number) : boolean
	dispatchMousedown(m : MouseInputMessage) : void
	dispatchMouseup(m : MouseInputMessage) : void	
}

