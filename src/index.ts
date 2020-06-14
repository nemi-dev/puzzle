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



const [gameCanvas, previewCanvas] = document.getElementsByTagName('canvas');
const gameContext = gameCanvas.getContext('2d');
const previewContext = previewCanvas.getContext('2d');
gameContext.textAlign = 'center';
gameContext.textBaseline = 'middle';

const horizontalMargin = 20;
const verticalMargin = 20;
const boardLength = gameCanvas.width - horizontalMargin * 2;
const timerHeight = gameCanvas.height / 5;

const sizeInput = document.getElementById('size') as HTMLInputElement;
const puzzleSelector = document.getElementById('puzzle-selector') as HTMLSelectElement;

const startButton = document.getElementById('start') as HTMLButtonElement;
const stopButton = document.getElementById('stop') as HTMLButtonElement;

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

function resetButtons() {
	startButton.innerText = '시작하기';
	stopButton.disabled = true;
}

function setSizeHandler() {
	game.setSize(sizeInput.valueAsNumber, ...decodeBlank());
	resetButtons();
}


function renderPreview({ texture, left, top, size } : PuzzleSet) {
	let { width, height } = previewCanvas;
	previewContext.clearRect(0, 0, width, height);
	previewContext.drawImage(
		texture,
		left,
		top,
		size,
		size,
		horizontalMargin, verticalMargin, width - horizontalMargin * 2, height - verticalMargin * 2
	)
}

loadPuzzleSets().then((puzzleSets) => {

	
	startButton.addEventListener('click', ev => {
		game.shuffle();
		game.initPiecePosition();
		game.start(ev.timeStamp);
		startButton.innerText = '다시하기';
		stopButton.disabled = false;
	});

	stopButton.addEventListener('click', ev => {
		game.end(ev.timeStamp);
		resetButtons();
	});


	blankPositionSelector.topLeft.addEventListener('input', setSizeHandler);
	blankPositionSelector.topRight.addEventListener('input', setSizeHandler);
	blankPositionSelector.bottomLeft.addEventListener('input', setSizeHandler);
	blankPositionSelector.bottomRight.addEventListener('input', setSizeHandler);

	sizeInput.addEventListener('change', setSizeHandler);

	puzzleSelector.addEventListener('change', ev => {
		game.setPuzzleSet(puzzleSets[puzzleSelector.value]);
		renderPreview(puzzleSets[puzzleSelector.value]);
		resetButtons();
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

	let puzzleSet : PuzzleSet = puzzleSets[puzzleSelector.value];
	let size = sizeInput.valueAsNumber;
	let scale = gameCanvas.width / gameCanvas.getBoundingClientRect().width;

	game = new Game(size, puzzleSet, horizontalMargin, verticalMargin, boardLength, timerHeight);
	game.completeHandlers.push(resetButtons);
	renderPreview(puzzleSet);

	input = new MouseInput();
	input.scale = scale;
	input.connect(gameCanvas, game);

	clock = new RAFPulseClock(t => {
		input.update();
		game.update(t, input);
		game.render(gameContext);
	});
	
	clock.run();
	window.game = game;

});



