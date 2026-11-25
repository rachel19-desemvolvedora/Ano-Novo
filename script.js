// --- CONFIGURAÇÃO INICIAL DO CANVAS ---
const canvas = document.getElementById('cenarioCanvas');
const ctx = canvas.getContext('2d');

let width = 0;
let height = 0;

// Ajusta o tamanho interno do canvas para acompanhar a janela do navegador
function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
}

window.addEventListener('resize', resize);
resize();

// --- CONTROLE DE ÁUDIO (MP3 + FALLBACK AMBIENTE) ---
const musica = document.getElementById('musicaFundo');
const btnAudio = document.getElementById('btnAudio');
const iconeAudio = document.getElementById('iconeAudio');
const textoAudio = document.getElementById('textoAudio');
const statusAudio = document.getElementById('statusAudio');

let tocando = false;
let usandoFallback = false;
let arquivoMp3Disponivel = false;

// Sintetizador ambiente simples (Web Audio API) caso "novo-tempo.mp3" não exista na pasta
let audioCtx = null;
let intervaloMelodia = null;

// Verifica se o arquivo "novo-tempo.mp3" existe e pode ser reproduzido
musica.addEventListener('canplaythrough', () => {
    arquivoMp3Disponivel = true;
    statusAudio.textContent = '';
});

musica.addEventListener('error', () => {
    arquivoMp3Disponivel = false;
    statusAudio.textContent = 'Arquivo "novo-tempo.mp3" não encontrado na pasta — usando som ambiente ao clicar em Play.';
});

// Toca uma sequência suave de notas caso o MP3 não esteja presente
function iniciarMelodiaAmbiente() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    if (!audioCtx) {
        audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    // Notas suaves em Dó maior (C4, E4, G4, A4, G4, E4)
    const notas = [261.63, 329.63, 392.00, 440.00, 392.00, 329.63];
    let passo = 0;

    function tocarNota() {
        if (!tocando || !usandoFallback || !audioCtx) return;

        const agora = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(notas[passo % notas.length], agora);

        // Envelope suave (fade-in e fade-out) para evitar cliques no áudio
        gain.gain.setValueAtTime(0.0001, agora);
        gain.gain.exponentialRampToValueAtTime(0.06, agora + 0.25);
        gain.gain.exponentialRampToValueAtTime(0.0001, agora + 1.4);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start(agora);
        osc.stop(agora + 1.45);
        passo++;
    }

    tocarNota();
    intervaloMelodia = setInterval(tocarNota, 1200);
}

function pararMelodiaAmbiente() {
    if (intervaloMelodia) {
        clearInterval(intervaloMelodia);
        intervaloMelodia = null;
    }
}

function atualizarInterfaceAudio(estaTocando, labelPersonalizado = '') {
    tocando = estaTocando;
    btnAudio.classList.toggle('tocando', estaTocando);

    if (estaTocando) {
        iconeAudio.textContent = '⏸';
        textoAudio.textContent = labelPersonalizado || 'Pausar Música';
    } else {
        iconeAudio.textContent = '▶';
        textoAudio.textContent = 'Tocar "Novo Tempo"';
    }
}

// Clique no botão Play / Pause
btnAudio.addEventListener('click', async () => {
    // Se já estiver tocando, pausa tanto o MP3 quanto o fallback
    if (tocando) {
        musica.pause();
        pararMelodiaAmbiente();
        usandoFallback = false;
        atualizarInterfaceAudio(false);
        return;
    }

    // Tenta reproduzir o arquivo "novo-tempo.mp3"
    try {
        await musica.play();
        usandoFallback = false;
        statusAudio.textContent = 'Reproduzindo "novo-tempo.mp3"';
        atualizarInterfaceAudio(true, 'Pausar "Novo Tempo"');
    } catch (erro) {
        // Caso o MP3 não exista ou falhe ao carregar, ativa o som ambiente de contingência
        usandoFallback = true;
        iniciarMelodiaAmbiente();
        statusAudio.textContent = 'Coloque "novo-tempo.mp3" na pasta do projeto para ouvir a gravação original.';
        atualizarInterfaceAudio(true, 'Pausar Som Ambiente');
    }
});

// --- FRASES INSPIRADORAS ROTATIVAS ---
const frases = [
    '"Um novo tempo há de vencer pra que a gente possa florescer..." — Roberto Carlos',
    '"Que cada onda renove suas esperanças e ilumine seus caminhos."',
    '"Deixe para trás o que passou e abrace as infinitas possibilidades do agora."',
    '"Paz, luz e recomeços: o melhor ainda está por vir."'
];

let indiceFrase = 0;
const fraseEl = document.getElementById('fraseRotativa');

// Alterna as frases a cada 5,5 segundos com transição de opacidade
setInterval(() => {
    fraseEl.style.opacity = '0';
    setTimeout(() => {
        indiceFrase = (indiceFrase + 1) % frases.length;
        fraseEl.textContent = frases[indiceFrase];
        fraseEl.style.opacity = '1';
    }, 600);
}, 5500);

// --- ELEMENTOS ANIMADOS DO CENÁRIO ---

// 1. Gaivotas voando ao fundo
class Gaivota {
    constructor() {
        this.reset();
        this.x = Math.random() * width; // Distribui inicialmente pela tela
    }

    reset() {
        this.x = -50;
        this.y = height * (0.12 + Math.random() * 0.25);
        this.speed = 0.8 + Math.random() * 1.2;
        this.wingSpan = 8 + Math.random() * 7;
        this.flapSpeed = 0.08 + Math.random() * 0.05;
        this.flapPhase = Math.random() * Math.PI * 2;
    }

    update() {
        this.x += this.speed;
        this.flapPhase += this.flapSpeed;
        if (this.x > width + 50) {
            this.reset();
        }
    }

    draw() {
        const wingY = Math.sin(this.flapPhase) * (this.wingSpan * 0.6);
        ctx.strokeStyle = 'rgba(40, 20, 30, 0.75)';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(this.x - this.wingSpan, this.y + wingY);
        ctx.quadraticCurveTo(this.x - this.wingSpan / 2, this.y - 4, this.x, this.y);
        ctx.quadraticCurveTo(this.x + this.wingSpan / 2, this.y - 4, this.x + this.wingSpan, this.y + wingY);
        ctx.stroke();
    }
}

// 2. Fogos de artifício no céu
class ParticulaFogo {
    constructor(x, y, cor) {
        this.x = x;
        this.y = y;
        this.cor = cor;
        const angle = Math.random() * Math.PI * 2;
        const velocity = Math.random() * 4 + 1;
        this.vx = Math.cos(angle) * velocity;
        this.vy = Math.sin(angle) * velocity;
        this.alpha = 1;
        this.decay = 0.012 + Math.random() * 0.015;
    }

    update() {
        this.vx *= 0.97; // Resistência do ar
        this.vy *= 0.97;
        this.vy += 0.04; // Gravidade suave
        this.x += this.vx;
        this.y += this.vy;
        this.alpha -= this.decay;
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.alpha);
        ctx.fillStyle = this.cor;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 2.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

let particulasFogos = [];
const coresFogos = ['#FFD700', '#FFF8DC', '#FFAE42', '#FFFFFF', '#FF6F61'];

function criarFogoArtificio() {
    const x = width * (0.15 + Math.random() * 0.7);
    const y = height * (0.1 + Math.random() * 0.35);
    const cor = coresFogos[Math.floor(Math.random() * coresFogos.length)];

    for (let i = 0; i < 45; i++) {
        particulasFogos.push(new ParticulaFogo(x, y, cor));
    }
}

// 3. NPCs passeando pela praia usando roupas brancas
class NpcPraia {
    constructor() {
        this.dir = Math.random() > 0.5 ? 1 : -1; // 1 = direita, -1 = esquerda
        this.x = this.dir === 1 ? -30 : width + 30;
        this.y = height * (0.83 + Math.random() * 0.11); // Faixa da areia
        this.speed = (0.35 + Math.random() * 0.4) * this.dir;
        this.stepPhase = Math.random() * 10;
        // Escala de perspectiva: personagens mais abaixo parecem ligeiramente maiores
        this.scale = 0.85 + ((this.y - height * 0.83) / (height * 0.15)) * 0.35;
        this.pele = ['#8d5524', '#c68642', '#e0ac69', '#f1c27d', '#5c3818'][Math.floor(Math.random() * 5)];
    }

    update() {
        this.x += this.speed;
        this.stepPhase += 0.08;

        // Inverte a direção ao chegar nas extremidades da tela
        if ((this.dir === 1 && this.x > width + 40) || (this.dir === -1 && this.x < -40)) {
            this.dir *= -1;
            this.speed *= -1;
        }
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.scale(this.scale, this.scale);

        const swing = Math.sin(this.stepPhase) * 4;

        // Sombra na areia
        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.beginPath();
        ctx.ellipse(0, 0, 10, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Pernas (calça branca)
        ctx.strokeStyle = '#f8f9fa';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(-2, -16);
        ctx.lineTo(-2 + swing, -2);
        ctx.moveTo(2, -16);
        ctx.lineTo(2 - swing, -2);
        ctx.stroke();

        // Tronco (camisa/vestido branco)
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.roundRect(-5, -32, 10, 18, 3);
        ctx.fill();

        // Cabeça
        ctx.fillStyle = this.pele;
        ctx.beginPath();
        ctx.arc(0, -37, 4.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

// Instancia gaivotas e NPCs ordenados por profundidade (Y)
const gaivotas = Array.from({ length: 7 }, () => new Gaivota());
const npcs = Array.from({ length: 8 }, () => new NpcPraia()).sort((a, b) => a.y - b.y);

let tempoOnda = 0;

// --- LOOP PRINCIPAL DE ANIMAÇÃO ---
function animar() {
    ctx.clearRect(0, 0, width, height);

    const horizonte = height * 0.62;

    // 1. Céu ao pôr do sol
    const gradCeu = ctx.createLinearGradient(0, 0, 0, horizonte);
    gradCeu.addColorStop(0, '#1b1438');
    gradCeu.addColorStop(0.45, '#7a2846');
    gradCeu.addColorStop(0.8, '#e86f38');
    gradCeu.addColorStop(1, '#ffbe55');
    ctx.fillStyle = gradCeu;
    ctx.fillRect(0, 0, width, horizonte);

    // 2. Sol se pondo no horizonte
    const solX = width * 0.5;
    const solY = horizonte - 10;
    const gradSol = ctx.createRadialGradient(solX, solY, 10, solX, solY, 120);
    gradSol.addColorStop(0, '#fffbe6');
    gradSol.addColorStop(0.3, '#ffd700');
    gradSol.addColorStop(1, 'rgba(255, 140, 0, 0)');
    ctx.fillStyle = gradSol;
    ctx.beginPath();
    ctx.arc(solX, solY, 120, 0, Math.PI * 2);
    ctx.fill();

    // 3. Fogos de artifício
    if (Math.random() < 0.03) {
        criarFogoArtificio();
    }
    particulasFogos = particulasFogos.filter(p => p.alpha > 0);
    particulasFogos.forEach(p => {
        p.update();
        p.draw();
    });

    // 4. Gaivotas
    gaivotas.forEach(g => {
        g.update();
        g.draw();
    });

    // 5. Oceano e reflexo dourado do sol
    const faixaPraia = height * 0.80;
    const gradMar = ctx.createLinearGradient(0, horizonte, 0, faixaPraia);
    gradMar.addColorStop(0, '#3a2342');
    gradMar.addColorStop(0.5, '#1d3557');
    gradMar.addColorStop(1, '#2a6f97');
    ctx.fillStyle = gradMar;
    ctx.fillRect(0, horizonte, width, faixaPraia - horizonte);

    ctx.fillStyle = 'rgba(255, 215, 0, 0.22)';
    for (let i = 0; i < 12; i++) {
        const yRef = horizonte + i * ((faixaPraia - horizonte) / 12);
        const wRef = 90 - i * 4 + Math.sin(tempoOnda + i) * 15;
        ctx.fillRect(solX - wRef / 2, yRef, wRef, 3);
    }

    // 6. Areia da praia e espuma das ondas
    const gradAreia = ctx.createLinearGradient(0, faixaPraia, 0, height);
    gradAreia.addColorStop(0, '#c29b61');
    gradAreia.addColorStop(1, '#8c693a');
    ctx.fillStyle = gradAreia;
    ctx.fillRect(0, faixaPraia, width, height - faixaPraia);

    tempoOnda += 0.03;
    const ondaY = faixaPraia + Math.sin(tempoOnda) * 6;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.beginPath();
    ctx.moveTo(0, faixaPraia - 5);
    ctx.lineTo(width, faixaPraia - 5);
    ctx.lineTo(width, ondaY + 4);
    ctx.lineTo(0, ondaY + 4);
    ctx.closePath();
    ctx.fill();

    // 7. NPCs de roupa branca caminhando na praia
    npcs.forEach(npc => {
        npc.update();
        npc.draw();
    });

    requestAnimationFrame(animar);
}

animar();