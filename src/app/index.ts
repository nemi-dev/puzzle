import PuzzleSet from './PuzzleSet'
import RAFPulseClock from './RAFPulseClock'
import Game from './Game'
import { MouseInput, TouchInput, Detector } from './Input';

let game : Game;
let clock : RAFPulseClock;

let detector : Detector;
let input : MouseInput | TouchInput;

let puzzleSet : PuzzleSet;
let puzzleSets : PuzzleSet[];

const startButton = document.getElementById('start');
const stopButton = document.getElementById('stop');
const nextButton = document.getElementById('next');
const randomButton = document.getElementById('random');

const previewWrapper = document.getElementById('puzzle-preview');

const gameCanvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const previewCanvas = document.getElementById('preview-canvas') as HTMLCanvasElement;
const timerCanvas = document.getElementById('timer-canvas') as HTMLCanvasElement;

const gameContext = gameCanvas.getContext('2d');
const previewContext = previewCanvas.getContext('2d');
const timerContext = timerCanvas.getContext('2d');

const horizontalMargin = 20;
const verticalMargin = 20;
const boardLength = gameCanvas.width - horizontalMargin * 2;

const timerWidth = timerCanvas.width - horizontalMargin * 2;
const timerHeight = timerCanvas.height;

const story = document.getElementById('story');

gameContext.textAlign = 'center';
gameContext.textBaseline = 'middle';

timerContext.textBaseline = 'middle';
timerContext.fillStyle = '#FFFFFF';

const config = document.getElementById('config');
const article = document.getElementById('article');

document.getElementById('show-config').addEventListener('click', ev => {
	config.hidden = !config.hidden;
});
document.getElementById('config-close').addEventListener('click', ev => {
	config.hidden = true;
});
document.getElementById('show-info').addEventListener('click', ev => {
	window.scrollTo({ top : article.getBoundingClientRect().top - 20, behavior : "smooth" })
})

const sizeDecrease = document.getElementById('size-decrease') as HTMLButtonElement;
const sizeIncrease = document.getElementById('size-increase') as HTMLButtonElement;
const sizeView = document.getElementById('size-view');

let puzzleSize = 3;
const minSize = 3;
const maxSize = 9;


const puzzleSelector = document.getElementById('puzzle-selector') as HTMLSelectElement;


const blankPositionSelector = {
	topLeft : document.getElementById('blank-pos-top-left') as HTMLInputElement,
	topRight : document.getElementById('blank-pos-top-right') as HTMLInputElement,
	bottomLeft : document.getElementById('blank-pos-bottom-left') as HTMLInputElement,
	bottomRight : document.getElementById('blank-pos-bottom-right') as HTMLInputElement,
}

function decodeBlank() : [boolean, boolean] {
	return [
		blankPositionSelector.bottomLeft.checked || blankPositionSelector.bottomRight.checked,
		blankPositionSelector.topRight.checked || blankPositionSelector.bottomRight.checked
	]
}

const labelSelector = {
	none : document.getElementById('show-label-none') as HTMLInputElement,
	phone : document.getElementById('show-label-phone') as HTMLInputElement,
	keypad : document.getElementById('show-label-keypad') as HTMLInputElement
}



async function loadPuzzleSets () {
	const puzzleSets : PuzzleSet[] = [];
	const response = await fetch('puzzleset.json');
	
	const puzzleSetDataArray = await response.json() as PuzzleSet[]
	for (let i = 0; i < puzzleSetDataArray.length; i++) {
		const puzzleSet = puzzleSetDataArray[i];
		(puzzleSet as PuzzleSet & { __proto__ : PuzzleSet }).__proto__ = PuzzleSet.prototype;
		puzzleSets.push(puzzleSet);

		const selectOption = document.createElement('option');
		selectOption.value = i.toString();
		selectOption.innerText = puzzleSet.title;
		puzzleSelector.appendChild(selectOption);
	}
	await Promise.all(puzzleSets.map(v => v.waitForImageLoad()));
	return puzzleSets;
}

function setButtonsAsInitial() {
	startButton.hidden = false;
	startButton.innerText = '시작하기';
	stopButton.hidden = true;
	nextButton.hidden = true;
	randomButton.hidden = false;
}

function setButtonsAsStart() {
	startButton.hidden = true;
	stopButton.hidden = false;
	nextButton.hidden = true;
	randomButton.hidden = true;
}

function setButtonsAsComplete() {
	startButton.hidden = false;
	startButton.innerText = '다시하기';
	stopButton.hidden = true;
	nextButton.hidden = false;
	randomButton.hidden = false;
}


function renderPreview({ texture, left, top, size } : PuzzleSet) {
	let { width, height } = previewCanvas;
	previewContext.clearRect(0, 0, width, height);
	previewContext.drawImage(texture, left, top, size, size, 0, 0, width, height);
}

function popStory() {
	previewWrapper.hidden = true;
	story.hidden = false;
	if (puzzleSet) story.innerText = puzzleSet.story;
}

function resetStory() {
	previewWrapper.hidden = false;
	story.hidden = true;
}


function setSize(v : number, bottom : boolean, right : boolean) {
	game.setSize(v, bottom, right);
	setButtonsAsInitial();
	resetStory();
}

function puzzleChangeHandler(ev : Event) {
	if (game.checkBeforeEnd()) {
		setSize(puzzleSize, ...decodeBlank());
	} else {
		ev.preventDefault();
		return false;
	}
}

function _start(t : DOMHighResTimeStamp) {
	game.end(null);
	game.shuffle();
	game.initPiecePosition();
	game.start(t);
	setButtonsAsStart();
	resetStory();
}

function _nextPuzzle(ev : Event) {
	let currentIndex = Number(puzzleSelector.value);
	do {
		currentIndex = (currentIndex + 1) % puzzleSelector.length;
		puzzleSet = puzzleSets[currentIndex];
	} while (!puzzleSet.solvable);
	puzzleSelector.value = currentIndex.toString();
}

function _randomPuzzle(ev : Event) {
	let beforeIndex = Number(puzzleSelector.value);
	let currentIndex : number;
	do {
		currentIndex = Math.floor(Math.random() * puzzleSelector.length);
		puzzleSet = puzzleSets[currentIndex];
	} while (!puzzleSet.solvable || (beforeIndex == currentIndex));
	puzzleSelector.value = currentIndex.toString();
}

loadPuzzleSets().then((sets) => {
	puzzleSets = sets;
	startButton.addEventListener('click', ev => {
		if (game.checkBeforeEnd()) {
			_start(ev.timeStamp);
		} else {
			ev.preventDefault();
			return false;
		}
	});

	stopButton.addEventListener('click', ev => {
		game.end(ev.timeStamp);
		setButtonsAsInitial();
	});

	nextButton.addEventListener('click', ev => {
		if (game.checkBeforeEnd()) {
			_nextPuzzle(ev);
			game.setPuzzleSet(puzzleSet);
			renderPreview(puzzleSet);
			_start(ev.timeStamp);
		} else {
			ev.preventDefault();
			return false;
		}
	});

	randomButton.addEventListener('click', ev => {
		if (game.checkBeforeEnd()) {
			_randomPuzzle(ev);
			game.setPuzzleSet(puzzleSet);
			renderPreview(puzzleSet);
			_start(ev.timeStamp);
		} else {
			ev.preventDefault();
			return false;
		}
	});

	blankPositionSelector.topLeft.addEventListener('input', puzzleChangeHandler);
	blankPositionSelector.topRight.addEventListener('input', puzzleChangeHandler);
	blankPositionSelector.bottomLeft.addEventListener('input', puzzleChangeHandler);
	blankPositionSelector.bottomRight.addEventListener('input', puzzleChangeHandler);

	sizeDecrease.addEventListener('click', ev => {
		if (game.checkBeforeEnd()) {
			puzzleSize -= 1;
			sizeIncrease.disabled = false;
			sizeView.innerText = puzzleSize.toString();
			if (puzzleSize == minSize) sizeDecrease.disabled = true;
			setSize(puzzleSize, ...decodeBlank());
		} else {
			ev.preventDefault();
			return false;
		}
	});

	sizeIncrease.addEventListener('click', ev => {
		if (game.checkBeforeEnd()) {
			puzzleSize += 1;
			sizeDecrease.disabled = false;
			sizeView.innerText = puzzleSize.toString();
			if (puzzleSize == maxSize) sizeIncrease.disabled = true;
			setSize(puzzleSize, ...decodeBlank());
		} else {
			ev.preventDefault();
			return false;
		}
	});

	puzzleSelector.addEventListener('change', ev => {
		if (game.checkBeforeEnd()) {
			puzzleSet = puzzleSets[puzzleSelector.value];
			game.setPuzzleSet(puzzleSet);
			renderPreview(puzzleSet);
			setButtonsAsInitial();
			resetStory();
		} else {
			ev.preventDefault();
			return false;
		}
	});

	labelSelector.none.addEventListener('input', ev => {
		game.showLabel = false;
	});

	labelSelector.phone.addEventListener('input', ev => {
		game.showLabel = true;
		game.assignLabel(false);
	});

	labelSelector.keypad.addEventListener('input', ev => {
		game.showLabel = true;
		game.assignLabel(true);
	});

	puzzleSet = sets[puzzleSelector.value];

	_randomPuzzle(null);
	game = new Game(puzzleSize, puzzleSet, horizontalMargin, verticalMargin, boardLength, timerWidth, timerHeight);
	game.completeHandlers.push(setButtonsAsComplete, popStory);
	renderPreview(puzzleSet);

	let scale = gameCanvas.width / gameCanvas.getBoundingClientRect().width;

	clock = new RAFPulseClock(t => {
		game.update(t);
		game.render(gameContext);
		game.timer.render(timerContext);
	});

	let updateFunctionOnInputConnected = (t : DOMHighResTimeStamp) => {
		input.update();
		game.update(t, input.coordinate);
		game.render(gameContext);
		game.timer.render(timerContext);
	}

	clock.start();

	detector = new Detector();

	detector.whenItsMouse = ev => {
		input = new MouseInput();
		input.connect(gameCanvas, game, scale);
		clock.update = updateFunctionOnInputConnected;
		if (ev.target == gameCanvas) input.onstart(ev);
	}

	detector.whenItsTouch = ev => {
		input = new TouchInput();
		input.connect(gameCanvas, game, scale);
		clock.update = updateFunctionOnInputConnected;
		if (ev.target == gameCanvas) input.onstart(ev);
	}

	detector.open();

});

