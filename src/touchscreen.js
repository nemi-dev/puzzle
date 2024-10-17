/**
 * 현재 앱에서 터치스크린을 감지한다.
 * 
 * https://stackoverflow.com/questions/4817029/whats-the-best-way-to-detect-a-touch-screen-device-using-javascript
 * 
 * @returns {boolean}
*/
export function isTouchDevice() {
	if (('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch) return true;

	const prefixes = ['-webkit-', '-moz-', '-o-', '-ms'];
	const mq = function (query) {
		return window.matchMedia(query).matches;
	};

	const query = ['(', prefixes.join('touch-enabled),('), 'heartz', ')'].join('');
	return mq(query);
}
