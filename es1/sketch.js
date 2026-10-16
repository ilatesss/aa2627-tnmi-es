// Fotografia: https://www.pexels.com/it-it/foto/paesaggio-astratto-surreale-dai-colori-vivaci-39033732/
// Autore: eugene golevesov
// Procedimento: la fotografia intera è lo sfondo di un livello; a intervalli
// regolari alcune porzioni rettangolari vengono estratte con get(), ricolorate
// con un'operazione casuale sui pixel (inversione, scambio dei canali, soglia,
// scala, mescola) e ricollocate altrove con image(), spostate di poco, riscalate
// e fuse al resto con un metodo di fusione casuale. Dopo qualche secondo il
// livello torna alla fotografia intera e il procedimento riparte.

const nomeFoto = "foto.jpg";

const larghezzaTela = 800;
const altezzaTela = 600;

const pausaMin = 1; 
const pausaMax = 3;

const pezziPassoMin = 3;
const pezziPassoMax = 8;

const durataCiclo = 1200;

const latoMin = 5;
const latoMax = 80;

const OPERAZIONI = ["inverti", "scambia", "cicla", "soglia", "scala", "mescola"];

const METODI_FUSIONE = [
  "BLEND",
  "MULTIPLY",
  "SCREEN",
  "DIFFERENCE",
  "OVERLAY",
  "HARD_LIGHT"
];

let foto;
let livello;

let prossimoPasso = 0;
let inizioCiclo = 0;

let scala = 1;
let offX = 0;
let offY = 0;

async function setup() {
  createCanvas(larghezzaTela, altezzaTela);

  try {
    foto = await loadImage(nomeFoto);
  } catch (errore) {
    avviso();
    return;
  }

  scala = max(larghezzaTela / foto.width, altezzaTela / foto.height);
  offX = (foto.width * scala - larghezzaTela) / 2;
  offY = (foto.height * scala - altezzaTela) / 2;

  livello = createGraphics(larghezzaTela, altezzaTela);
  livello.noSmooth(); 
  riparti();
}

function riparti() {
  livello.clear();
  livello.blendMode(BLEND); 
  livello.image(foto, -offX, -offY, foto.width * scala, foto.height * scala);
  inizioCiclo = frameCount;
  prossimoPasso = frameCount + floor(random(pausaMin, pausaMax + 1));
}

function avviso() {
  noLoop();
  background(255);
  fill(20);
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(16);
  text(
    "Non riesco a caricare " + nomeFoto + ".\nApri la pagina con Live Server (pulsante Go Live).",
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
  let w, h;
  const tipoPezzo = random(1);
  
  if (tipoPezzo < 0.33) {
    w = floor(random(latoMin * 2, latoMax * 2));
    h = floor(random(latoMin, latoMin * 3));
  } else if (tipoPezzo < 0.66) {
    w = floor(random(latoMin, latoMin * 3));
    h = floor(random(latoMin * 2, latoMax * 2));
  } else {
    w = floor(random(latoMin, latoMax));
    h = floor(random(latoMin, latoMax));
  }

  const daX = floor(random(larghezzaTela - w));
  const daY = floor(random(altezzaTela - h));

  const pezzo = livello.get(daX, daY, w, h);

  ricolora(pezzo);

  let aX = daX;
  let aY = daY;
  
  if (random(1) < 0.5) {
     aX += random(-20, 20); 
  } else {
     aY += random(-20, 20); 
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

function draw() {
  if (!foto) return;

  background(20); 

  if (frameCount - inizioCiclo > durataCiclo) {
    riparti();
  }

  if (frameCount >= prossimoPasso) {
    const n = floor(random(pezziPassoMin, pezziPassoMax + 1));
    for (let i = 0; i < n; i++) {
      spostaPezzo();
    }
    prossimoPasso = frameCount + floor(random(pausaMin, pausaMax + 1));
  }

  image(livello, 0, 0);
}