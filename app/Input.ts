/**
 * DOM 이벤트를 이용하여 마우스 입력을 받아들이는 컴포넌트
 * 이벤트 루프가 rAF보다 훨씬 빈번하게 일어나므로 입력값을 rAF-synchronize시키는 기능도 있다.
 */
export default class Input {
	public startX : number = null
	public startY : number = null
	public startTime : number = null

	public endX : number = null
	public endY : number = null
	public endTime : number = null

	connect() {

	}

	disconnect() {

	}

	/** rAF */
	clock() {

	}

}