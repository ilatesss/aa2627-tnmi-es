const nomeFoto = "foto.jpg";

const larghezzaTela = 800;
const altezzaTela = 600;

const pausaMin = 1; 
const pausaMax = 3;

const pezziPassoMin = 4;
const pezziPassoMax = 10;

const latoMin = 5;
const latoMax = 80;

const OPERAZIONI = ["inverti", "scambia", "cicla", "soglia", "scala", "mescola"];
const METODI_FUSIONE = ["BLEND", "MULTIPLY", "SCREEN", "DIFFERENCE", "OVERLAY", "HARD_LIGHT"];

let foto;
let livello;
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

  livello = createGraphics(larghezzaTela, altezzaTela);
  livello.noSmooth(); 

  livello.image(livelloBase, 0, 0);
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
  let yOrigine = random(altezzaTela);
  
  if (random(1) < 0.3) {
    yOrigine = random(altezzaTela * 0.4);
  }

  const moltiplicatore = map(yOrigine, 0, altezzaTela, 0.8, 2.5);

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
  const daY = floor(constrain(yOrigine, 0, altezzaTela - h));

  const pezzo = livello.get(daX, daY, w, h);

  ricolora(pezzo);

  let aX = daX;
  let aY = daY;
  
  if (random(1) < 0.5) {
     aX += random(-20 * moltiplicatore, 20 * moltiplicatore); 
  } else {
     aY += random(-20 * moltiplicatore, 20 * moltiplicatore); 
  }

  const metodoScelto = random(METODI_FUSIONE);
  livello.blendMode(window[metodoScelto]);

  livello.push();
  livello.translate(aX + w / 2, aY + h / 2); 
  
  let scaleX = random(0.9, 1.5);
  let scaleY = random(0.9, 1.5);
  livello.scale(scaleX, scaleY);
  
  livello.imageMode(CENTER);
  livello.image(pezzo, 0, 0);
  livello.pop();
  
  livello.blendMode(BLEND);
}

function riparaPezzo() {
  let w = floor(random(latoMin * 2, latoMax * 3));
  let h = floor(random(latoMin * 2, latoMax * 3));
  let x = floor(random(larghezzaTela - w));
  let y = floor(random(altezzaTela - h));

  let pezzoSano = livelloBase.get(x, y, w, h);
  
  livello.blendMode(BLEND);
  livello.image(pezzoSano, x, y);
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
    if (frameCount % 2 === 0) {
      const n = floor(random(1, 4));
      for (let i = 0; i < n; i++) {
        riparaPezzo();
      }
    }
  }

  push();
  translate(larghezzaTela / 2, altezzaTela / 2);
  scale(1.05); 
  
  let movX = map(noise(frameCount * 0.005), 0, 1, -15, 15);
  let movY = map(noise(frameCount * 0.005 + 100), 0, 1, -15, 15);
  
  imageMode(CENTER);
  image(livello, movX, movY);
  pop();
}
