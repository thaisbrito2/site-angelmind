/* =========================================================
   AngelMind — interações do site
   ========================================================= */

const reduzirMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;


/* ---------- Navegação: estado ao rolar + barra de progresso ---------- */

const nav = document.querySelector(".navegação");
const progresso = document.querySelector(".progresso");

function aoRolar() {
  const y = window.scrollY;
  if (nav) nav.classList.toggle("rolado", y > 40);
  if (progresso) {
    const total = document.documentElement.scrollHeight - window.innerHeight;
    progresso.style.transform = `scaleX(${total > 0 ? y / total : 0})`;
  }
}
window.addEventListener("scroll", aoRolar, { passive: true });
aoRolar();


/* ---------- Menu mobile ---------- */

const toggle = document.querySelector(".menu-toggle");
const menu = document.querySelector(".menu");

if (toggle && menu) {
  const fechar = () => {
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Abrir menu");
    document.body.classList.remove("menu-aberto");
  };

  toggle.addEventListener("click", () => {
    const aberto = toggle.getAttribute("aria-expanded") === "true";
    if (aberto) { fechar(); return; }
    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-label", "Fechar menu");
    document.body.classList.add("menu-aberto");
  });

  menu.querySelectorAll("a").forEach(a => a.addEventListener("click", fechar));
  document.addEventListener("keydown", e => { if (e.key === "Escape") fechar(); });
}


/* ---------- Link ativo conforme a seção visível ---------- */

const links = [...document.querySelectorAll('.menu-link[href^="#"]')];
const alvos = links
  .map(l => document.getElementById(decodeURIComponent(l.getAttribute("href").slice(1))))
  .filter(Boolean);

if (alvos.length && "IntersectionObserver" in window) {
  const obsMenu = new IntersectionObserver(entradas => {
    entradas.forEach(en => {
      if (!en.isIntersecting) return;
      links.forEach(l => {
        const id = decodeURIComponent(l.getAttribute("href").slice(1));
        l.classList.toggle("ativo", id === en.target.id);
      });
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  alvos.forEach(a => obsMenu.observe(a));
}


/* ---------- Revelar elementos ao rolar ---------- */

const revelaveis = document.querySelectorAll(".revelar");

if (!reduzirMovimento && "IntersectionObserver" in window) {
  document.documentElement.classList.add("js-revelar");
  const obs = new IntersectionObserver((entradas, o) => {
    entradas.forEach(en => {
      if (en.isIntersecting) {
        en.target.classList.add("visivel");
        o.unobserve(en.target);
      }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });

  revelaveis.forEach((el, i) => {
    // pequeno escalonamento entre irmãos
    const irmaos = [...el.parentElement.children].filter(c => c.classList.contains("revelar"));
    el.style.transitionDelay = `${Math.min(irmaos.indexOf(el), 4) * 90}ms`;
    obs.observe(el);
  });
}


/* ---------- Brilho que segue o cursor nos cards ---------- */

document.querySelectorAll(".card, .painel, .lado-direito, .contagrao-card, .formulario, .diferenciais li")
  .forEach(el => {
    el.addEventListener("pointermove", e => {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${e.clientX - r.left}px`);
      el.style.setProperty("--my", `${e.clientY - r.top}px`);
    });
  });


/* ---------- Rede neural interativa (hero) ---------- */

const canvas = document.querySelector(".rede-neural");

if (canvas) {
  const ctx = canvas.getContext("2d");
  const cores = ["148,0,211", "0,255,255", "255,0,255"];
  let w, h, dpr, nos = [], mouse = { x: -9999, y: -9999 }, rodando = true;

  function criar() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const qtd = Math.round(Math.min(110, Math.max(36, (w * h) / 14000)));
    nos = Array.from({ length: qtd }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() * 1.6 + 0.6,
      c: cores[Math.floor(Math.random() * cores.length)]
    }));
  }

  function desenhar() {
    ctx.clearRect(0, 0, w, h);
    const lim = Math.min(150, w / 7);

    for (let i = 0; i < nos.length; i++) {
      const a = nos[i];

      if (!reduzirMovimento) {
        // leve atração ao cursor
        const dxm = mouse.x - a.x, dym = mouse.y - a.y;
        const dm = Math.hypot(dxm, dym);
        if (dm < 200) { a.x += dxm * 0.004; a.y += dym * 0.004; }

        a.x += a.vx; a.y += a.vy;
        if (a.x < 0 || a.x > w) a.vx *= -1;
        if (a.y < 0 || a.y > h) a.vy *= -1;
      }

      for (let j = i + 1; j < nos.length; j++) {
        const b = nos[j];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < lim) {
          ctx.strokeStyle = `rgba(${a.c},${(1 - d / lim) * 0.35})`;
          ctx.lineWidth = 0.6;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }

      const dc = Math.hypot(mouse.x - a.x, mouse.y - a.y);
      if (dc < 180) {
        ctx.strokeStyle = `rgba(0,255,255,${(1 - dc / 180) * 0.5})`;
        ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
      }

      ctx.fillStyle = `rgba(${a.c},0.9)`;
      ctx.shadowColor = `rgba(${a.c},1)`;
      ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
    }

    if (rodando && !reduzirMovimento) requestAnimationFrame(desenhar);
  }

  const hero = canvas.parentElement;
  hero.addEventListener("pointermove", e => {
    const r = canvas.getBoundingClientRect();
    mouse.x = e.clientX - r.left;
    mouse.y = e.clientY - r.top;
  });
  hero.addEventListener("pointerleave", () => { mouse.x = mouse.y = -9999; });

  // pausa quando a hero sai da tela
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([en]) => {
      const antes = rodando;
      rodando = en.isIntersecting;
      if (rodando && !antes && !reduzirMovimento) requestAnimationFrame(desenhar);
    }).observe(hero);
  }

  let t;
  window.addEventListener("resize", () => {
    clearTimeout(t);
    t = setTimeout(() => { criar(); if (reduzirMovimento) desenhar(); }, 150);
  });

  criar();
  desenhar();
}


/* ---------- Formulário de contato (EmailJS + WhatsApp) ---------- */

const form = document.getElementById("form-contato");

if (form) {
  const status = form.querySelector(".form-status");
  const btnEmail = form.querySelector('button[type="submit"]');

  const mostrar = (msg, tipo) => {
    status.textContent = msg;
    status.dataset.tipo = tipo;
  };

  if (window.emailjs) {
    /* 🔥 INICIALIZA EMAILJS */
    emailjs.init("a2tPiQ06DpsnR8-Ik");
  }

  /* 📩 ENVIO DE EMAIL */
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!window.emailjs) { mostrar("Erro ao enviar email...", "erro"); return; }

    btnEmail.disabled = true;
    btnEmail.classList.add("enviando");
    mostrar("", "");

    emailjs.sendForm("service_mqb7qmo", "template_dwxozse", this)
      .then(() => {
        mostrar("Email enviado com sucesso! 🚀", "ok");
        form.reset();
      }, () => {
        mostrar("Erro ao enviar email...", "erro");
      })
      .finally(() => {
        btnEmail.disabled = false;
        btnEmail.classList.remove("enviando");
      });
  });

  /* 📱 WHATSAPP */
  document.getElementById("btn-whatsapp").addEventListener("click", function () {
    const nome = form.querySelector('input[name="user_name"]').value;
    const mensagem = form.querySelector('textarea[name="message"]').value;
    const texto = `Olá, meu nome é ${nome}. ${mensagem}`;
    window.open(`https://wa.me/5567993205452?text=${encodeURIComponent(texto)}`);
  });
}


/* ---------- Cards expansíveis (página de projetos) ---------- */

function toggleCard(card) {
  const conteudo = card.querySelector(".conteudo-card");
  const aberto = card.classList.toggle("ativo");
  conteudo.style.height = aberto ? conteudo.scrollHeight + "px" : "0px";
  card.setAttribute("aria-expanded", aberto ? "true" : "false");
}

document.querySelectorAll(".pagina-projetos .card").forEach(card => {
  card.setAttribute("tabindex", "0");
  card.setAttribute("role", "button");
  card.setAttribute("aria-expanded", "false");
  card.addEventListener("keydown", e => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleCard(card); }
  });
});
