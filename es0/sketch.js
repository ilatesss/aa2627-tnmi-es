// E0. Forme geometriche reattive
//
// Obiettivo: una composizione di forme geometriche che reagisca al movimento
// del mouse.
//
// Vincoli ricavati dalle specifiche (https://codestesie.it/aa2627/tnmi/attivita/es0/):
// - comporre alcune forme geometriche semplici, con un accostamento che regga
//   anche da fermo;
// - far dipendere dalla posizione del mouse almeno un parametro delle forme
//   (dimensione, colore, rotazione o distanza fra gli elementi);
// - verificare ogni passaggio nel browser;
// - leggere il codice prodotto e farsi spiegare le parti non chiare, perché
//   andrà poi modificato a mano;
// - consegnare dal repository con un'anteprima preview.png del risultato
//   finale.

// Le specifiche non prescrivono dimensioni: la tela riempie la finestra.

// Colori fissi della scena: si possono cambiare qui.
const COLORE_FONDO = "#0d1020";
const COLORE_ALTO = "rgba(58,74,132,0.34)";
const COLORE_RIGHE = "rgba(150,175,235,0.035)";

// Stato iniziale al centro: questa è la composizione "a riposo".
let mx = 0.5;
let my = 0.5;

// Generatore pseudo-casuale con seme: le silhouette sono identiche a ogni
// caricamento, quindi la composizione a riposo è sempre la stessa.
function seeded(seed) {
	return function () {
		seed = (seed * 1664525 + 1013904223) % 4294967296;
		return seed / 4294967296;
	};
}

/* Contorni organici chiusi: profilo polare con lobi morbidi.
   Ogni forma è definita una volta sola e poi deformata dal mouse. */
const SHAPES = [
	// x,    y,    r,   hue, spin,  seed
	[ 0.320, 0.575, 0.255, 250,  1.00,   11 ],  // massa dominante, basso sx
	[ 0.665, 0.425, 0.205, 205, -1.15,   29 ],  // contrappeso a destra
	[ 0.500, 0.515, 0.155,  25,  1.35,   47 ],  // forma che collega le due masse
	[ 0.245, 0.245, 0.135, 275,  0.95,   71 ],  // massa fredda in alto a sx
	[ 0.520, 0.290, 0.130, 225, -0.85,   63 ],  // centro in alto
	[ 0.735, 0.760, 0.100, 335,  1.20,   97 ],  // appoggio basso a dx
	[ 0.415, 0.795, 0.085, 195, -1.45,   83 ],  // appoggio basso a sx
	[ 0.790, 0.230, 0.055,  25, -1.60,  109 ],  // accento caldo in alto a dx
	[ 0.315, 0.155, 0.048, 210,  1.70,  113 ],  // accento in alto a sx
	[ 0.905, 0.545, 0.042, 265, -1.30,  127 ],  // piccolo dettaglio a destra
];

// Il profilo si campiona in questo punto: con 120 il bordo è già liscio.
const SAMPLES = 120;

let shapes = [];

function setup() {
	createCanvas(windowWidth, windowHeight);
	build();
}

// Alla ridimensionamento la finestra le forme vanno ricalcolate,
// perché le loro posizioni sono frazioni della tela.
function windowResized() {
	resizeCanvas(windowWidth, windowHeight);
	build();
}

function build() {
	shapes = SHAPES.map(([nx, ny, nr, hue, spin, seed]) => {
		const rnd = seeded(seed);
		return {
			x: nx * width,
			y: ny * height,
			r: nr * min(width, height),
			hue,
			spin,
			// Carattere della forma: armoniche basse del profilo radiale.
			// Ampiezze molto contenute = contorni tondi e morbidi, quasi
			// circolari ma mai perfettamente identici fra loro.
			a1: 0.030 + rnd() * 0.045,
			a2: 0.020 + rnd() * 0.035,
			a3: 0.008 + rnd() * 0.020,
			p1: rnd() * Math.PI * 2,
			p2: rnd() * Math.PI * 2,
			p3: rnd() * Math.PI * 2,
		};
	});
	// Le forme grandi stanno sotto, le piccole sopra: profondità costante.
	shapes.sort((a, b) => b.r - a.r);
}

// Il mouse si muove sopra la tela, non serve altro ascoltare la finestra.
function mouseMoved() {
	mx = mouseX / width;
	my = mouseY / height;
}

// Anche trascinando con il tasto premuto la composizione deve seguire.
function mouseDragged() {
	mouseMoved();
}

/* Profilo radiale della forma, in coordinate locali.
   r(th) = 1 + a1*sin(th+p1) + a2*sin(2th+p2) + a3*cos(3th+p3)
   Con ampiezze sommate < 1 r(th) resta sempre positivo: la curva è chiusa,
   liscia e non si auto-interseca mai, per qualsiasi posizione del mouse. */
function silhouette(s, mx, my, size) {
	const pts = [];
	const elong = s.a1 * (0.5 + my * 1.0);          // my -> leggero allungamento
	const ph2 = s.p2 + mx * Math.PI * 2;           // mx -> i due lobi ruotano
	for (let i = 0; i < SAMPLES; i++) {
		const th = (i / SAMPLES) * Math.PI * 2;
		const r = size * (
			1
			+ elong * Math.sin(th + s.p1)
			+ s.a2 * Math.sin(2 * th + ph2)
			+ s.a3 * Math.cos(3 * th + s.p3)
		);
		pts.push(Math.cos(th) * r, Math.sin(th) * r);
	}
	return pts;
}

/* Traccia il contorno chiuso passando per i punti medi: con 120 campioni
   il risultato è visivamente perfettamente liscio.
   I gradienti e le composizioni dei colori non esistono in p5: si usano
   le istruzioni del canvas, accessibili con drawingContext. */
function tracePath(pts) {
	const ctx = drawingContext;
	const n = SAMPLES;
	ctx.beginPath();
	ctx.moveTo((pts[(n - 1) * 2] + pts[0]) / 2, (pts[(n - 1) * 2 + 1] + pts[1]) / 2);
	for (let i = 0; i < n; i++) {
		const j = (i + 1) % n;
		ctx.quadraticCurveTo(
			pts[i * 2], pts[i * 2 + 1],
			(pts[i * 2] + pts[j * 2]) / 2,
			(pts[i * 2 + 1] + pts[j * 2 + 1]) / 2
		);
	}
	ctx.closePath();
}

function draw() {
	const lato = min(width, height);
	const ctx = drawingContext;

	// Sfondo con un respiro di luce decentrato (statico, non animato).
	ctx.fillStyle = COLORE_FONDO;
	ctx.fillRect(0, 0, width, height);

	const glow = ctx.createRadialGradient(
		width * 0.46, height * 0.42, lato * 0.05,
		width * 0.46, height * 0.42, lato * 0.95
	);
	glow.addColorStop(0, COLORE_ALTO);
	glow.addColorStop(1, "rgba(13,16,32,0)");
	ctx.fillStyle = glow;
	ctx.fillRect(0, 0, width, height);

	// Sovrapposizioni luminose: dove i colori si incontrano si schiariscono.
	ctx.globalCompositeOperation = "lighter";

	for (const s of shapes) {
		/* ---- mappatura diretta del mouse, nessun smorzamento ---- */
		const size = s.r * (0.66 + my * 0.66);   // y -> dimensione
		const rot = (mx - 0.5) * Math.PI * 2 * s.spin;
		const hue = s.hue + mx * 100;            // x -> colore
		const sat = 60 + mx * 24;
		const lig = 44 + (1 - my) * 14;

		ctx.save();
		ctx.translate(s.x, s.y);
		ctx.rotate(rot);

		tracePath(silhouette(s, mx, my, size));

		const g = ctx.createRadialGradient(
			-size * 0.26, -size * 0.30, size * 0.03,
			0, 0, size * 1.22
		);
		g.addColorStop(0, `hsla(${hue + 10}, ${sat - 6}%, ${lig + 17}%, 0.92)`);
		g.addColorStop(0.55, `hsla(${hue}, ${sat}%, ${lig}%, 0.84)`);
		g.addColorStop(1, `hsla(${hue - 12}, ${sat - 8}%, ${lig - 12}%, 0.62)`);
		ctx.fillStyle = g;
		ctx.fill();

		/* Volume: luce dall'alto a sinistra, ombra interna in basso a destra.
		   Contrasti tenui, perché la forma deve restare morbida. */
		ctx.save();
		ctx.clip();
		const sh = ctx.createLinearGradient(
			-size * 0.9, -size * 0.9, size * 0.9, size * 0.9
		);
		sh.addColorStop(0, 'rgba(255,255,255,0.07)');
		sh.addColorStop(0.5, 'rgba(255,255,255,0)');
		sh.addColorStop(1, 'rgba(0,0,0,0.13)');
		ctx.fillStyle = sh;
		ctx.fillRect(-size * 1.6, -size * 1.6, size * 3.2, size * 3.2);
		ctx.restore();

		// Alone esterno morbido: sfuma il bordo e unisce le forme vicine.
		ctx.lineJoin = 'round';
		ctx.lineWidth = size * 0.14;
		ctx.strokeStyle = `hsla(${hue + 10}, ${sat}%, ${lig + 6}%, 0.12)`;
		ctx.stroke();

		// Contorno luminoso sottile: definisce il bordo con precisione.
		ctx.lineWidth = 1;
		ctx.strokeStyle = `hsla(${hue + 22}, ${sat + 12}%, ${lig + 26}%, 0.5)`;
		ctx.stroke();

		ctx.restore();
	}

	ctx.globalCompositeOperation = 'source-over';

	// Anelli concentrici appena percettibili: danno fondo e scala.
	ctx.lineWidth = 1;
	ctx.strokeStyle = COLORE_RIGHE;
	for (let i = 1; i <= 5; i++) {
		ctx.beginPath();
		ctx.arc(width * 0.5, height * 0.5, lato * 0.16 * i, 0, Math.PI * 2);
		ctx.stroke();
	}

	// Vignettatura per chiudere la composizione sul bordo.
	const vig = ctx.createRadialGradient(
		width / 2, height / 2, lato * 0.3,
		width / 2, height / 2, Math.max(width, height) * 0.8
	);
	vig.addColorStop(0, 'rgba(0,0,0,0)');
	vig.addColorStop(1, 'rgba(0,0,0,0.5)');
	ctx.fillStyle = vig;
	ctx.fillRect(0, 0, width, height);
}
