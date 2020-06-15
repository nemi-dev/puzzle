declare global {
	interface Window {
		game : Game
	}
}


import PuzzleSet from './PuzzleSet'
import RAFPulseClock from './RAFPulseClock'
import Game from './Game'
import MouseInput from './Input';

let game : Game;
let clock : RAFPulseClock;
let input : MouseInput;
let puzzleSet : PuzzleSet;
let puzzleSets : PuzzleSet[];

const previewWrapper = document.getElementById('puzzle-preview');

const gameCanvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const previewCanvas = document.getElementById('preview-canvas') as HTMLCanvasElement;
const timerCanvas = document.getElementById('timer-canvas') as HTMLCanvasElement;

const gameContext = gameCanvas.getContext('2d');
const previewContext = previewCanvas.getContext('2d');
const timerContext = timerCanvas.getContext('2d');

const story = document.getElementById('story');

gameContext.textAlign = 'center';
gameContext.textBaseline = 'middle';

timerContext.textAlign = 'center';
timerContext.textBaseline = 'middle';
timerContext.fillStyle = '#FFFFFF';

const horizontalMargin = 20;
const verticalMargin = 20;
const boardLength = gameCanvas.width - horizontalMargin * 2;
const timerHeight = timerCanvas.height;

const sizeInput = document.getElementById('size') as HTMLInputElement;
const puzzleSelector = document.getElementById('puzzle-selector') as HTMLSelectElement;

const startButton = document.getElementById('start') as HTMLButtonElement;
const stopButton = document.getElementById('stop') as HTMLButtonElement;
const nextButton = document.getElementById('next') as HTMLButtonElement;
const randomButton = document.getElementById('random') as HTMLButtonElement;

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
	randomButton.hidden = true;
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
	previewContext.drawImage(
		texture, left, top, size, size,
		horizontalMargin, verticalMargin, width - horizontalMargin * 2, height - verticalMargin * 2
	)
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

function setPuzzleSize(ev : Event) {
	if (game.checkBeforeEnd()) {
		game.setSize(sizeInput.valueAsNumber, ...decodeBlank());
		setButtonsAsInitial();
		resetStory();
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
			game.setPuzzleSet(puzzleSets[puzzleSelector.value]);
			renderPreview(puzzleSets[puzzleSelector.value]);
			_start(ev.timeStamp);
		} else {
			ev.preventDefault();
			return false;
		}
	});

	randomButton.addEventListener('click', ev => {
		if (game.checkBeforeEnd()) {
			_randomPuzzle(ev);
			game.setPuzzleSet(puzzleSets[puzzleSelector.value]);
			renderPreview(puzzleSets[puzzleSelector.value]);
			_start(ev.timeStamp);
		} else {
			ev.preventDefault();
			return false;
		}
	});

	blankPositionSelector.topLeft.addEventListener('input', setPuzzleSize);
	blankPositionSelector.topRight.addEventListener('input', setPuzzleSize);
	blankPositionSelector.bottomLeft.addEventListener('input', setPuzzleSize);
	blankPositionSelector.bottomRight.addEventListener('input', setPuzzleSize);

	sizeInput.addEventListener('change', setPuzzleSize);

	puzzleSelector.addEventListener('change', ev => {
		if (game.checkBeforeEnd()) {
			game.setPuzzleSet(puzzleSets[puzzleSelector.value]);
			renderPreview(puzzleSets[puzzleSelector.value]);
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
	let size = sizeInput.valueAsNumber;
	let scale = gameCanvas.width / gameCanvas.getBoundingClientRect().width;

	game = new Game(size, puzzleSet, horizontalMargin, verticalMargin, boardLength, timerHeight);
	game.completeHandlers.push(setButtonsAsComplete, popStory);
	renderPreview(puzzleSet);

	input = new MouseInput();
	input.scale = scale;
	input.connect(gameCanvas, game);

	clock = new RAFPulseClock(t => {
		input.update();
		game.update(t, input);
		game.render(gameContext);
		game.timer.render(timerContext);
	});
	
	clock.run();
	window.game = game;

});



