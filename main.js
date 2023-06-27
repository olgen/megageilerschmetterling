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
var lastEyesPixel = 233;
var firstAntennaPixel = 234;
var lastAntennaPixel = 235;

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

var va;

var lastBlink = 0;
export var debug = 0;

modes = [
  effectSpin,
  (index) => {
    // h = 0.5;
    v = brightness;
  },
  (index) => {
    if (buttonValue == 0.0) {
      lastBlink = now;
    }
    // h = 0.7;
    v = brightness;
    s = 1;

    if (lastBlink != 0) {
      delta = min(now - lastBlink, 500) / 500.0;
      debug = delta;
      if (delta == 1) {
        lastBlink = 0;
      }
      // h = max(0.7, 1- delta)
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

function updateAccelerometer(delta) {
  // ground: -0.02
  // range: -0.005 - -0.035
  newValue = accelerometer[1];
  va = 0.95 * va + 0.05 * newValue;

  // accelHistory[currentIdx] = va;
  // currentIdx += 1;
  // if (currentIdx == accelHistory.length) {
  //   currentIdx = 0;
  // }
  // averageVA = arraySum(accelHistory) / arrayLength(accelHistory);
  // normalizedVA = +0.5 + averageVA * 10; // use 0 as middle for the slider
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

function setHue() {
  h = 1 + va * 8;
}

function updatePot() {
  newValue = analogInputs[4];
  pot = pot * (1 - weight) + newValue * weight;
}

function updateButton() {
  buttonValue = digitalRead(BUTTON_PIN);
}

function renderWing(index) {
  modes[mode](index);
  if (index < 30 + 5000 * (va + 0.02)) {
    v = brightness;
  } else if (index > lastWingsPixel - 30 - 5000 * (va + 0.02)) {
    v = brightness;
  } else {
    v = 0;
  }
  hsv(h, s, v);
}

// i broke this again with making the vars local but eh
function renderEye(index) {
  pixelRange = lastEyesPixel - firstEyesPixel;
  pct = index / pixelRange; // Percent this pixel is into the eyes part of the strip
  hh = pct * (5 * wave(t1 * 3) + 5) + 2 * wave(t1 * 2);
  hh = (h % 0.5) + t1; // Remainder has precedence over addition
  vv = triangle(5 * pct + 10 * t1);
  vv = vv * vv * vv;
  vv = max(brightness, vv);
  hsv(hh, 1, vv);
}

function renderAntenna(index) {
  if (buttonValue == 0.0) {
    lastBlink = now;
  }
  hh = 0.7;
  vv = brightness;
  ss = 1;

  if (lastBlink != 0) {
    delta = min(now - lastBlink, 500) / 500.0;
    debug = delta / 4;
    if (delta == 1) {
      lastBlink = 0;
    }
    hh = max(0.7, 1 - delta);
    vv = max(brightness, 1 - delta);
    ss = min(1, delta);
  }

  hsv(hh, ss, vv);

  // var hh = wave(time(0.2))
  // if (index == firstAntennaPixel) {
  //   hsv(hh,0.7,wave(time(0.06)))
  // } else {
  //   hsv(hh,0.9,wave(time(0.1)))
  // }
}

export function beforeRender(delta) {
  now += delta;
  t1 = time(0.1);
  checkModeSwitch(delta);
  updateAccelerometer(delta);
  //setSaturation()
  setBrightness();
  setHue();
  updatePot();
  updateButton();
  if (va > -0.015) {
    buttonValue = 0;
  }
}

export function render(index) {
  if (index <= lastWingsPixel) {
    renderWing(index);
  } else if (index <= lastEyesPixel) {
    renderEye(index);
  } else {
    renderAntenna(index);
  }
}
