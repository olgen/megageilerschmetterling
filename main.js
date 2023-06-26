// potentiometer averaged
export var pot;
pinMode(analogInputs[4], INPUT_PULLDOWN);

// extra button
var BUTTON_PIN = 33;
pinMode(BUTTON_PIN, INPUT_PULLUP);
export var buttonValue;

// timing
export var now;

// Shake to switch modes
export var accelerometer; // Enable the accelerometer
export var mode = 2;
export var analogInputs;

var debounce = 0;
var accelerationToModeSwitch = 0.03;

// PIXELS:
var firstWingsPixel = 0;
var lastWingsPixel = 225;
var firstEyesPixel = 226;
var lastEyesPixel = 234;
var firstAntennaPixel = 235;
var lastAntennaPixel = 236;

historyLength = 50;
var accelHistory = array(historyLength);
var currentIdx = 0;
export var averageVA = 0;
export var normalizedVA;
var s = 0;
export var brightness = 1;

export var h = 1;
export var s = 1;
export var v = 1;

var lastBlink = 0;
export var debug = 0;

modes = [
  effectSpin,
  (index) => {
    h = 0.5;
    v = brightness;
  },
  (index) => {
    if (buttonValue == 0.0) {
      lastBlink = now;
    }
    h = 0.7;
    v = brightness;
    s = 1;

    if (lastBlink != 0) {
      delta = min(now - lastBlink, 500) / 500.0;
      debug = delta;
      if (delta == 1) {
        lastBlink = 0;
      }
      h = max(0.7, 1 - delta);
      v = max(brightness, 1 - delta);
      s = min(1, delta);
    }
  },
];

var t1;
function effectSpin(index) {
  pct = index / pixelCount; // Percent this pixel is into the overall strip
  h = pct * (5 * wave(t1) + 5) + 2 * wave(t1);
  h = (h % 0.5) + t1; // Remainder has precedence over addition
  v = triangle(5 * pct + 10 * t1);
  v = v * v * v;
  v = max(brightness, v);
  hsv(h, 1, v);
}

function checkModeSwitch(delta) {
  // 3D vector sum of x, y, and z acceleration
  horizontalAcceleration = sqrt(
    accelerometer[0] * accelerometer[0] +
      //accelerometer[1] * accelerometer[1] +
      accelerometer[2] * accelerometer[2]
  );

  debounce = clamp(debounce + delta, 0, 2000); // Prevent overflow

  // Cycle mode if sensor board is shaken, no more than 1x / sec
  if (debounce > 1000 && horizontalAcceleration >= accelerationToModeSwitch) {
    //mode = (mode + 1) % 3;
    debounce = 0;
  }
}

export function gaugeVerticalAccel() {
  return normalizedVA;
}

function updateAccelHistory(delta) {
  va = accelerometer[1];
  accelHistory[currentIdx] = va;
  currentIdx += 1;
  if (currentIdx == accelHistory.length) {
    currentIdx = 0;
  }
  averageVA = arraySum(accelHistory) / arrayLength(accelHistory);
  normalizedVA = +0.5 + averageVA * 10; // use 0 as middle for the slider
}

function mapVAToZeroToOne(t) {
  a = 0.2;
  b = 0.7;
  c = 0;
  d = 1;
  res = c + ((d - c) / (b - a)) * (t - a);
  return clamp(res, c, d);
}

function setSaturation() {
  s = mapVAToZeroToOne(normalizedVA);
}

var weight = 0.1;
function setBrightness() {
  //brightness = mapVAToZeroToOne(normalizedVA);
  newValue = analogInputs[4];
  brightness = brightness * (1 - weight) + newValue * weight;
}

function updatePot() {
  newValue = analogInputs[4];
  pot = pot * (1 - weight) + newValue * weight;
}

function updateButton() {
  buttonValue = digitalRead(BUTTON_PIN);
}

function renderEye(index) {
  if (index == firstEyesPixel) {
    hsv(0.99, 1, wave(time(0.07)));
  } else {
    hsv(0.89, 1, wave(time(0.1)));
  }
}

function renderAntenna(index) {
  if (index == firstAntennaPixel) {
    hsv(0.95, 1, wave(time(0.07)));
  } else {
    hsv(0.96, 1, wave(time(0.1)));
  }
}

export function beforeRender(delta) {
  now += delta;
  t1 = time(0.1);
  checkModeSwitch(delta);
  updateAccelHistory(delta);
  //setSaturation()
  setBrightness();
  updatePot();
  updateButton();
}

export function render(index) {
  if (index <= lastWingsPixel) {
    // render body
    modes[mode](index);
    hsv(h, s, v);
  } else if (index <= lastEyesPixel) {
    renderEye(index);
  } else {
    renderAntenna(index);
  }
}
