const nomeFoto = "foto.jpg";

const larghezzaTela = 800;
const altezzaTela = 600;

const pausaMin = 1; 
const pausaMax = 3;

const pezziPassoMin = 3;
const pezziPassoMax = 8;

const latoMin = 5;
const latoMax = 80;

const OPERAZIONI = ["inverti", "scambia", "cicla", "soglia", "scala", "mescola"];
const METODI_FUSIONE = ["BLEND", "MULTIPLY", "SCREEN", "DIFFERENCE", "OVERLAY", "HARD_LIGHT"];

const NUM_LIVELLI = 3;

let foto;
let livelli = [];
let livelloBase;

let prossimoPasso = 0;
let scala = 1;
let offX = 0;
let offY = 0;

let statoAzione = "PLAY"; 

async function setup() {
  let tela = createCanvas(larghezzaTela, altezzaTela);
  tela.parent('sketch-container');

  document.getElementById('btn-indietro').addEventListener('click', () => {
    statoAzione = "INDIETRO";
    document.getElementById('btn-play').innerText = '▶';
  });

  document.getElementById('btn-play').addEventListener('click', () => {
    if (statoAzione === "PLAY" || statoAzione === "INDIETRO") {
      statoAzione = "PAUSA";
      document.getElementById('btn-play').innerText = '▶';
    } else {
      statoAzione = "PLAY";
      document.getElementById('btn-play').innerText = '⏸';
    }
  });

  try {
    foto = await loadImage(nomeFoto);
  } catch (errore) {
    avviso();
    return;
  }

  scala = max(larghezzaTela / foto.width, altezzaTela / foto.height);
  offX = (foto.width * scala - larghezzaTela) / 2;
  offY = (foto.height * scala - altezzaTela) / 2;

  livelloBase = createGraphics(larghezzaTela, altezzaTela);
  livelloBase.image(foto, -offX, -offY, foto.width * scala, foto.height * scala);

  for (let i = 0; i < NUM_LIVELLI; i++) {
    let l = createGraphics(larghezzaTela, altezzaTela);
    l.noSmooth();
    if (i === 0) {
      l.image(livelloBase, 0, 0);
    }
    livelli.push(l);
  }

  prossimoPasso = frameCount;
}

function avviso() {
  noLoop();
  background(255);
  fill(20);
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(16);
  text(
    "Non riesco a caricare " + nomeFoto + ".\nApri la pagina con Live Server.",
    width / 2,
    height / 2
  );
}

function ricolora(img) {
  const op = random(OPERAZIONI);
  const fattoreR = random(0.4, 1.6);
  const fattoreG = random(0.4, 1.6);
  const fattoreB = random(0.4, 1.6);
  const soglia = random(60, 200);
  const mescola = random(0.3, 0.9);

  img.loadPixels();
  for (let i = 0; i < img.pixels.length; i += 4) {
    let r = img.pixels[i];
    let g = img.pixels[i + 1];
    let b = img.pixels[i + 2];

    if (op === "inverti") {
      r = 255 - r;
      g = 255 - g;
      b = 255 - b;
    } else if (op === "scambia") {
      const tmp = r;
      r = b;
      b = tmp;
    } else if (op === "cicla") {
      const tmp = r;
      r = g;
      g = b;
      b = tmp;
    } else if (op === "soglia") {
      const media = (r + g + b) / 3;
      const v = media > soglia ? 255 : 0;
      r = v;
      g = v;
      b = v;
    } else if (op === "scala") {
      r *= fattoreR;
      g *= fattoreG;
      b *= fattoreB;
    } else if (op === "mescola") {
      const media = (r + g + b) / 3;
      r = lerp(r, media, mescola);
      g = lerp(g, media, mescola);
      b = lerp(b, media, mescola);
    }
    img.pixels[i] = r;
    img.pixels[i + 1] = g;
    img.pixels[i + 2] = b;
  }
  img.updatePixels();
}

function spostaPezzo() {
  let probabilita = random(1);
  let idx;
  if (probabilita < 0.5) idx = 0; 
  else if (probabilita < 0.8) idx = 1;
  else idx = 2;

  let moltiplicatore = 1;
  if (idx === 0) moltiplicatore = random(0.4, 0.8);
  else if (idx === 1) moltiplicatore = random(0.8, 1.5);
  else if (idx === 2) moltiplicatore = random(1.5, 3.0);

  let w, h;
  const tipoPezzo = random(1);
  if (tipoPezzo < 0.33) {
    w = floor(random(latoMin * 2, latoMax * 2) * moltiplicatore);
    h = floor(random(latoMin, latoMin * 3) * moltiplicatore);
  } else if (tipoPezzo < 0.66) {
    w = floor(random(latoMin, latoMin * 3) * moltiplicatore);
    h = floor(random(latoMin * 2, latoMax * 2) * moltiplicatore);
  } else {
    w = floor(random(latoMin, latoMax) * moltiplicatore);
    h = floor(random(latoMin, latoMax) * moltiplicatore);
  }

  w = constrain(w, 1, larghezzaTela);
  h = constrain(h, 1, altezzaTela);

  const daX = floor(random(larghezzaTela - w));
  const daY = floor(random(altezzaTela - h));

  const pezzo = livelli[0].get(daX, daY, w, h);
  ricolora(pezzo);

  let aX = daX;
  let aY = daY;
  if (random(1) < 0.5) {
     aX += random(-20, 20) * moltiplicatore; 
  } else {
     aY += random(-20, 20) * moltiplicatore; 
  }

  let l = livelli[idx];
  const metodoScelto = random(METODI_FUSIONE);
  l.blendMode(window[metodoScelto]);

  l.push();
  l.translate(aX + w / 2, aY + h / 2); 
  l.scale(random(0.9, 1.5), random(0.9, 1.5));
  l.imageMode(CENTER);
  l.image(pezzo, 0, 0);
  l.pop();
  
  l.blendMode(BLEND);
}

function riparaPezzo() {
  let w = floor(random(latoMin * 2, latoMax * 3));
  let h = floor(random(latoMin * 2, latoMax * 3));
  let x = floor(random(larghezzaTela - w));
  let y = floor(random(altezzaTela - h));

  let pezzoSano = livelloBase.get(x, y, w, h);
  
  livelli[0].imageMode(CORNER);
  livelli[0].blendMode(BLEND);
  livelli[0].tint(255, 25); 
  livelli[0].image(pezzoSano, x, y);
  livelli[0].noTint();

  for (let i = 1; i < NUM_LIVELLI; i++) {
    livelli[i].rectMode(CORNER);
    livelli[i].erase(255); 
    livelli[i].noStroke();
    livelli[i].rect(x, y, w, h);
    livelli[i].noErase();
  }
}

function draw() {
  if (!foto) return;

  background(20); 

  if (statoAzione === "PLAY") {
    if (frameCount >= prossimoPasso) {
      const n = floor(random(pezziPassoMin, pezziPassoMax + 1));
      for (let i = 0; i < n; i++) {
        spostaPezzo();
      }
      prossimoPasso = frameCount + floor(random(pausaMin, pausaMax + 1));
    }
  } else if (statoAzione === "INDIETRO") {
    if (frameCount % 4 === 0) {
      const n = floor(random(1, 4));
      for (let i = 0; i < n; i++) {
        riparaPezzo();
      }
    }
  }

  push();
  translate(larghezzaTela / 2, altezzaTela / 2);
  scale(1.15); 
  
  let baseMovX = map(noise(frameCount * 0.005), 0, 1, -15, 15);
  let baseMovY = map(noise(frameCount * 0.005 + 100), 0, 1, -15, 15);
  
  imageMode(CENTER);
  for (let i = 0; i < NUM_LIVELLI; i++) {
    let parallaxFactor = 1 + (i * 0.8); 
    
    if (i > 0) {
      tint(255, 230);
    } else {
      noTint();
    }
    
    image(livelli[i], baseMovX * parallaxFactor, baseMovY * parallaxFactor);
  }
  pop();
  noTint();
}