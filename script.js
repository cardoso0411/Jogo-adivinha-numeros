// ===== Constantes =====
const TENTATIVAS_INICIAIS = 3;
const PONTOS_POR_TENTATIVA = 30;
const STORAGE_RECORDE = "jogo_adivinhacao_recorde";
const STORAGE_TEMA = "jogo_adivinhacao_tema";
const HISTORICO_MAX = 8;

// ===== Pré-carregamento de áudios =====
const somAcerto = new Audio("acerto.mp3");
const somErro = new Audio("erro.mp3");
somAcerto.preload = "auto";
somErro.preload = "auto";

const tocar = (audio) => {
    try {
        audio.currentTime = 0;
        const p = audio.play();
        if (p && typeof p.catch === "function") p.catch(() => {});
    } catch (_) { /* ignora */ }
};

// ===== Objeto Jogo =====
const Jogo = {
    el: {
        select: document.getElementById("dificuldade"),
        input: document.getElementById("palpite"),
        msg: document.getElementById("mensagem"),
        pontuacao: document.getElementById("pontuacao"),
        recorde: document.getElementById("recorde"),
        historico: document.getElementById("historico"),
        container: document.getElementById("jogo"),
        btnModo: document.getElementById("btnModo"),
        btnJogar: document.getElementById("btnJogar"),
        btnReiniciar: document.getElementById("btnReiniciar"),
        btnMusica: document.getElementById("btnMusica"),
        musica: document.getElementById("musica"),
    },

    estado: {
        segredo: 0,
        tentativas: TENTATIVAS_INICIAIS,
        pontos: 0,
        recorde: 0,
        historico: [],
    },

    init() {
        this.carregarRecorde();
        this.carregarTema();
        this.atualizarLimitesInput();
        this.novaRodada();
        this.bindEvents();
    },

    bindEvents() {
        this.el.select.addEventListener("change", () => {
            this.atualizarLimitesInput();
            this.novaRodada();
        });
        this.el.btnJogar.addEventListener("click", () => this.jogar());
        this.el.btnReiniciar.addEventListener("click", () => this.reiniciar());
        this.el.btnModo.addEventListener("click", () => this.alternarTema());
        this.el.btnMusica.addEventListener("click", () => this.toggleMusica());
        this.el.input.addEventListener("keydown", (e) => {
            if (e.key === "Enter") this.jogar();
        });
    },

    atualizarLimitesInput() {
        const max = parseInt(this.el.select.value, 10);
        this.el.input.min = "1";
        this.el.input.max = String(max);
    },

    novaRodada() {
        const max = parseInt(this.el.select.value, 10);
        this.estado.segredo = Math.floor(Math.random() * max) + 1;
        this.estado.tentativas = TENTATIVAS_INICIAIS;
        this.estado.historico = [];
        this.el.input.value = "";
        this.el.msg.innerText = `Você tem ${TENTATIVAS_INICIAIS} tentativas. Boa sorte!`;
        this.renderHistorico();
        this.el.input.focus();
    },

    reiniciar() {
        this.estado.pontos = 0;
        this.atualizarPontuacao();
        this.novaRodada();
    },

    jogar() {
        const raw = this.el.input.value.trim();
        // Validação de inteiro (rejeita "3.7", "abc", vazio)
        if (!/^-?\d+$/.test(raw)) {
            this.el.msg.innerText = "Digite um número inteiro válido.";
            this.feedbackErro();
            return;
        }
        const palpite = parseInt(raw, 10);
        const max = parseInt(this.el.select.value, 10);

        if (palpite < 1 || palpite > max) {
            this.el.msg.innerText = `Digite um número entre 1 e ${max}.`;
            this.feedbackErro();
            return;
        }

        if (palpite === this.estado.segredo) {
            tocar(somAcerto);
            const ganho = this.estado.tentativas * PONTOS_POR_TENTATIVA;
            this.estado.pontos += ganho;
            this.el.msg.innerText = `🎉 Acertou! +${ganho} pontos.`;
            this.adicionarHistorico(palpite, "acerto");
            this.atualizarPontuacao();
            this.verificarRecorde();
            this.feedbackAcerto();
            setTimeout(() => this.novaRodada(), 900);
        } else {
            tocar(somErro);
            this.estado.tentativas--;
            this.adicionarHistorico(palpite, "erro");
            if (this.estado.tentativas > 0) {
                this.el.msg.innerText = `❌ Errou! Você tem ${this.estado.tentativas} tentativa(s).`;
                this.feedbackErro();
            } else {
                this.el.msg.innerText = `💥 Você perdeu! O número era ${this.estado.segredo}.`;
                this.feedbackErro();
                setTimeout(() => this.novaRodada(), 1200);
            }
        }
        this.el.input.value = "";
        this.el.input.focus();
    },

    adicionarHistorico(palpite, tipo) {
        this.estado.historico.unshift({ palpite, tipo });
        if (this.estado.historico.length > HISTORICO_MAX) {
            this.estado.historico.pop();
        }
        this.renderHistorico();
    },

    renderHistorico() {
        this.el.historico.innerHTML = "";
        this.estado.historico.forEach(({ palpite, tipo }) => {
            const li = document.createElement("li");
            li.textContent = `${tipo === "acerto" ? "✅" : "❌"} ${palpite}`;
            this.el.historico.appendChild(li);
        });
    },

    atualizarPontuacao() {
        this.el.pontuacao.innerText = "Pontuação: " + this.estado.pontos;
    },

    verificarRecorde() {
        if (this.estado.pontos > this.estado.recorde) {
            this.estado.recorde = this.estado.pontos;
            try { localStorage.setItem(STORAGE_RECORDE, String(this.estado.recorde)); } catch (_) {}
            this.el.recorde.innerText = "Recorde: " + this.estado.recorde;
        }
    },

    carregarRecorde() {
        try {
            const v = parseInt(localStorage.getItem(STORAGE_RECORDE) || "0", 10);
            this.estado.recorde = isNaN(v) ? 0 : v;
        } catch (_) {
            this.estado.recorde = 0;
        }
        this.el.recorde.innerText = "Recorde: " + this.estado.recorde;
    },

    toggleMusica() {
        if (this.el.musica.paused) {
            const p = this.el.musica.play();
            if (p && typeof p.catch === "function") p.catch(() => {});
        } else {
            this.el.musica.pause();
        }
    },

    alternarTema() {
        const body = document.body;
        // Usuário tem preferência explícita: alterna dark <-> light
        const prefereDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        const estaDark = body.classList.contains("dark-mode")
            || (prefereDark && !body.classList.contains("light-mode"));
        body.classList.remove("dark-mode", "light-mode");
        if (estaDark) {
            body.classList.add("light-mode");
            try { localStorage.setItem(STORAGE_TEMA, "light"); } catch (_) {}
        } else {
            body.classList.add("dark-mode");
            try { localStorage.setItem(STORAGE_TEMA, "dark"); } catch (_) {}
        }
    },

    carregarTema() {
        try {
            const t = localStorage.getItem(STORAGE_TEMA);
            if (t === "dark") document.body.classList.add("dark-mode");
            else if (t === "light") document.body.classList.add("light-mode");
        } catch (_) {}
    },

    feedbackErro() {
        const c = this.el.container;
        c.classList.remove("shake");
        void c.offsetWidth; // força reflow para reiniciar animação
        c.classList.add("shake");
    },

    feedbackAcerto() {
        const c = this.el.container;
        c.classList.remove("flash");
        void c.offsetWidth;
        c.classList.add("flash");
    },
};

Jogo.init();