import Link from "next/link";
import type { Metadata } from "next";
import DemoCTA, { WA_LINK } from "@/components/landing/DemoCTA";

/* ─── Metadata ───────────────────────────────────────────────────────────── */

export const metadata: Metadata = {
  title:
    "Cliniq — Sistema de gestão para clínicas pequenas e profissionais da saúde",
  description:
    "Agenda, pacientes, financeiro e leads em um único painel para clínicas pequenas. Agende uma demonstração gratuita do Cliniq.",
  openGraph: {
    title: "Cliniq — Gestão simples para clínicas pequenas",
    description:
      "Agenda, pacientes, financeiro e leads em um único painel. Feito para esteticistas, fisioterapeutas, nutricionistas, psicólogos e clínicas com até 3 profissionais.",
    type: "website",
    locale: "pt_BR",
    siteName: "Cliniq",
  },
};

/* ─── Shared ─────────────────────────────────────────────────────────────── */

const SERIF = { fontFamily: "'Instrument Serif', Georgia, serif" };

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-700">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
        >
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
        </svg>
      </div>
      <span className="text-lg font-bold tracking-tight text-slate-900">
        Cliniq
      </span>
    </div>
  );
}

function Check() {
  return <span className="flex-shrink-0 text-emerald-600">✓</span>;
}

/* ─── Page ───────────────────────────────────────────────────────────────── */

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white antialiased">
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* NAV                                                                */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-slate-100 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5 sm:px-8">
          <Logo />

          <div className="hidden items-center gap-7 text-[0.8125rem] font-medium text-slate-500 md:flex">
            <a href="#para-quem" className="transition hover:text-slate-900">
              Para quem
            </a>
            <a
              href="#funcionalidades"
              className="transition hover:text-slate-900"
            >
              Funcionalidades
            </a>
            <a href="#planos" className="transition hover:text-slate-900">
              Planos
            </a>
            <a href="#faq" className="transition hover:text-slate-900">
              FAQ
            </a>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden text-[0.8125rem] font-medium text-slate-500 transition hover:text-slate-900 sm:block"
            >
              Entrar
            </Link>

            <DemoCTA
              variant="primary"
              label="Agendar demo"
              className="!rounded-lg !px-4 !py-2 !text-[0.8125rem] !shadow-none"
            />
          </div>
        </div>
      </nav>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 1. HERO                                                            */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden pb-20 pt-28 sm:pt-36 md:pb-28">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 50% at 25% 40%, rgba(29,78,216,0.04) 0%, transparent 70%), radial-gradient(ellipse 50% 40% at 75% 35%, rgba(13,148,136,0.03) 0%, transparent 70%)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "linear-gradient(rgba(15,23,42,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.02) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />

        <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50/60 px-4 py-1.5">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-teal-500" />
              <span className="text-[0.8125rem] font-medium text-blue-700">
                Acesso antecipado — vagas limitadas
              </span>
            </div>

            <h1
              className="text-[clamp(2.25rem,5.5vw,3.75rem)] font-bold leading-[1.08] tracking-tight text-slate-900"
              style={{ letterSpacing: "-0.035em" }}
            >
              O sistema de gestão
              <br />
              para sua{" "}
              <span className="italic text-blue-700" style={SERIF}>
                clínica
              </span>{" "}
              pequena
            </h1>

            <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-slate-500">
              Agenda, pacientes, financeiro e leads em um painel simples. Feito
              para profissionais da saúde e clínicas com até 3 profissionais.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <DemoCTA label="Agendar demonstração gratuita" />
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-[0.9375rem] font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                Testar grátis por 14 dias
              </Link>
            </div>

            <p className="mt-5 text-xs text-slate-400">
              Sem cartão de crédito · Setup em 5 minutos · Cancele quando quiser
            </p>
          </div>

          {/* ── Dashboard mockup ── */}
          <div className="mx-auto mt-16 max-w-5xl">
            <div
              className="overflow-hidden rounded-xl border border-slate-200/80"
              style={{
                boxShadow:
                  "0 24px 80px rgba(15,23,42,0.08), 0 4px 16px rgba(15,23,42,0.04)",
              }}
            >
              <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-2.5">
                <div className="flex gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-300" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
                </div>
                <div className="mx-3 flex-1">
                  <div className="rounded-md border border-slate-200 bg-white px-3 py-1 text-xs text-slate-400">
                    app.cliniq.com.br/dashboard
                  </div>
                </div>
              </div>

              <div className="flex min-h-[360px]">
                <div className="hidden w-48 flex-shrink-0 bg-slate-900 px-3 py-4 md:block">
                  <div className="mb-6 flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-600">
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth="2.5"
                      >
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4" />
                      </svg>
                    </div>
                    <span className="text-xs font-bold text-white">Cliniq</span>
                  </div>

                  <div className="space-y-0.5 text-[11px]">
                    <div className="rounded-md bg-white/10 px-2.5 py-2 font-medium text-white">
                      📊 Dashboard
                    </div>
                    <div className="px-2.5 py-2 text-white/40">📅 Agenda</div>
                    <div className="px-2.5 py-2 text-white/40">
                      👤 Pacientes
                    </div>
                    <div className="px-2.5 py-2 text-white/40">
                      💰 Financeiro
                    </div>
                    <div className="px-2.5 py-2 text-white/40">🎯 Leads</div>
                  </div>
                </div>

                <div className="flex-1 bg-white p-5">
                  <p className="text-sm font-bold text-slate-900">
                    Bom dia, Dra. Ana! 👋
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-400">
                    Segunda-feira, 16 de março de 2026
                  </p>

                  <div className="mt-4 grid grid-cols-2 gap-2.5 md:grid-cols-4">
                    {[
                      {
                        label: "Consultas hoje",
                        value: "8",
                        color: "text-blue-700",
                      },
                      {
                        label: "Confirmados",
                        value: "6",
                        color: "text-emerald-600",
                      },
                      {
                        label: "Faturamento mês",
                        value: "R$12,4k",
                        color: "text-slate-900",
                      },
                      {
                        label: "Novos pacientes",
                        value: "+12",
                        color: "text-teal-600",
                      },
                    ].map((s) => (
                      <div
                        key={s.label}
                        className="rounded-lg border border-slate-100 p-3"
                      >
                        <div className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                          {s.label}
                        </div>
                        <div className={`mt-1 text-xl font-bold ${s.color}`}>
                          {s.value}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 space-y-2">
                    <p className="text-xs font-semibold text-slate-700">
                      Próximas consultas
                    </p>

                    {[
                      {
                        time: "09:00",
                        patient: "Maria Silva",
                        service: "Limpeza de pele",
                        status: "Confirmado",
                        sc: "bg-emerald-50 text-emerald-700",
                        bar: "bg-blue-600",
                      },
                      {
                        time: "10:00",
                        patient: "João Pedro",
                        service: "Avaliação nutricional",
                        status: "Pendente",
                        sc: "bg-amber-50 text-amber-700",
                        bar: "bg-teal-500",
                      },
                    ].map((a) => (
                      <div
                        key={a.time}
                        className="flex items-center gap-3 rounded-lg border border-slate-100 p-2.5"
                      >
                        <div className={`h-8 w-[3px] rounded-full ${a.bar}`} />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-slate-800">
                            {a.time} — {a.patient}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {a.service}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${a.sc}`}
                        >
                          {a.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 2. PARA QUEM É                                                     */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section
        id="para-quem"
        className="border-y border-slate-100 bg-slate-50/50 py-14 [scroll-margin-top:96px]"
      >
        <div className="mx-auto max-w-5xl px-5 sm:px-8">
          <p className="text-center text-[0.8125rem] font-semibold uppercase tracking-widest text-teal-600">
            Feito para você
          </p>

          <h2 className="mt-3 text-center text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            Profissionais da saúde e clínicas com até 3 profissionais
          </h2>

          <div className="mx-auto mt-8 flex flex-wrap items-center justify-center gap-3">
            {[
              "Esteticistas",
              "Fisioterapeutas",
              "Nutricionistas",
              "Psicólogos",
              "Personal Trainers",
              "Clínicas pequenas",
            ].map((p) => (
              <span
                key={p}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-[0.8125rem] font-medium text-slate-700 shadow-sm"
              >
                {p}
              </span>
            ))}
          </div>

          <p className="mx-auto mt-6 max-w-md text-center text-[0.875rem] leading-relaxed text-slate-500">
            Se você atende pacientes e hoje usa WhatsApp, planilha ou agenda de
            papel, o Cliniq foi feito para simplificar sua rotina.
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 3. PROBLEMA                                                        */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <p className="text-[0.8125rem] font-semibold uppercase tracking-widest text-teal-600">
              O problema
            </p>

            <h2 className="mt-3 text-[clamp(1.75rem,3.5vw,2.5rem)] font-bold leading-tight tracking-tight text-slate-900">
              Você cuida de pacientes.
              <br />
              Mas quem{" "}
              <span className="italic text-blue-700" style={SERIF}>
                cuida
              </span>{" "}
              da sua gestão?
            </h2>
          </div>

          <div className="mx-auto grid max-w-4xl gap-5 md:grid-cols-3">
            {[
              {
                icon: "📱",
                title: "WhatsApp para tudo",
                desc: "Confirma consulta, remarca, cobra e responde paciente o dia inteiro por mensagem.",
              },
              {
                icon: "📊",
                title: "Planilha que ninguém atualiza",
                desc: "No começo do mês ela existe. Depois some. No fim, você não sabe quanto entrou.",
              },
              {
                icon: "📒",
                title: "Agenda de papel",
                desc: "Paciente liga, você não lembra o horário. Profissional novo? Ninguém sabe quem atende o quê.",
              },
            ].map((p) => (
              <div
                key={p.title}
                className="rounded-xl border border-red-100 bg-red-50/50 p-5"
              >
                <span className="text-2xl">{p.icon}</span>
                <p className="mt-3 text-[0.9375rem] font-semibold text-red-900">
                  {p.title}
                </p>
                <p className="mt-2 text-[0.8125rem] leading-relaxed text-red-700/80">
                  {p.desc}
                </p>
              </div>
            ))}
          </div>

          <p className="mx-auto mt-10 max-w-md text-center text-[0.9375rem] text-slate-500">
            Resultado: você perde{" "}
            <strong className="text-slate-900">horas toda semana</strong> com
            administração em vez de atender pacientes.
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 4. SOLUÇÃO                                                         */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section className="bg-blue-50/40 py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <p className="text-[0.8125rem] font-semibold uppercase tracking-widest text-blue-700">
              A solução
            </p>

            <h2 className="mt-3 text-[clamp(1.75rem,3.5vw,2.5rem)] font-bold leading-tight tracking-tight text-slate-900">
              Um painel. Tudo{" "}
              <span className="italic text-blue-700" style={SERIF}>
                organizado
              </span>
              .
            </h2>

            <p className="mt-4 text-[0.9375rem] leading-relaxed text-slate-500">
              O Cliniq substitui ferramentas improvisadas por um sistema feito
              para a rotina de quem atende pacientes.
            </p>
          </div>

          <div className="mx-auto grid max-w-4xl gap-4 md:grid-cols-3">
            {[
              {
                emoji: "📱",
                from: "WhatsApp",
                to: "Agenda digital",
                desc: "Agende, confirme e reagende sem sair do sistema.",
                gradient: "from-blue-700 to-blue-500",
              },
              {
                emoji: "📊",
                from: "Planilha",
                to: "Financeiro integrado",
                desc: "Registre pagamentos e veja quanto faturou em tempo real.",
                gradient: "from-teal-600 to-teal-400",
              },
              {
                emoji: "📒",
                from: "Caderno",
                to: "Fichas digitais",
                desc: "Cadastro completo, histórico e prontuário de cada paciente.",
                gradient: "from-blue-900 to-blue-700",
              },
            ].map((item) => (
              <div
                key={item.from}
                className="flex items-start gap-3.5 rounded-xl border border-slate-200/80 bg-white p-5"
              >
                <div
                  className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${item.gradient}`}
                >
                  <span className="text-lg">{item.emoji}</span>
                </div>
                <div>
                  <p className="text-[0.9375rem] font-semibold text-slate-900">
                    {item.from} → {item.to}
                  </p>
                  <p className="mt-1 text-[0.8125rem] leading-relaxed text-slate-500">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 5. FUNCIONALIDADES                                                 */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section
        id="funcionalidades"
        className="py-20 md:py-28 [scroll-margin-top:96px]"
      >
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <p className="text-[0.8125rem] font-semibold uppercase tracking-widest text-teal-600">
              Funcionalidades
            </p>

            <h2 className="mt-3 text-[clamp(1.75rem,3.5vw,2.5rem)] font-bold leading-tight tracking-tight text-slate-900">
              Tudo que você precisa.
              <br />
              Nada que você{" "}
              <span className="italic text-blue-700" style={SERIF}>
                não
              </span>{" "}
              precisa.
            </h2>
          </div>

          <div className="mx-auto grid max-w-4xl gap-5 md:grid-cols-2">
            {[
              {
                icon: "📅",
                bg: "bg-blue-50",
                title: "Organize seus horários com clareza",
                desc: "Veja consultas do dia ou da semana, distribua por profissional e atualize o status com poucos cliques.",
                tags: [
                  "Visão dia/semana",
                  "Status 1-clique",
                  "Multi-profissional",
                ],
              },
              {
                icon: "👤",
                bg: "bg-emerald-50",
                title: "Acesse o histórico de qualquer paciente",
                desc: "Nome, contato, histórico de consultas e prontuário em um só lugar. Encontre qualquer paciente em segundos.",
                tags: ["Ficha completa", "Histórico", "Busca rápida"],
              },
              {
                icon: "💰",
                bg: "bg-amber-50",
                title: "Acompanhe pagamentos sem planilha",
                desc: "Registre pagamentos, marque como pago e acompanhe o faturamento do mês no dashboard.",
                tags: ["Pago / Pendente", "Faturamento mensal", "Multi-método"],
              },
              {
                icon: "🎯",
                bg: "bg-violet-50",
                title: "Não perca oportunidades de novos pacientes",
                desc: "Saiba quem entrou em contato, de onde veio e em que etapa está. Transforme leads em pacientes com mais organização.",
                tags: ["Pipeline", "Origem", "Conversão"],
              },
            ].map((f) => (
              <div
                key={f.title}
                className="group rounded-2xl border border-slate-200/80 bg-white p-6 transition hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-200/50"
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl text-xl ${f.bg}`}
                >
                  {f.icon}
                </div>
                <h3 className="mt-4 text-lg font-bold text-slate-900">
                  {f.title}
                </h3>
                <p className="mt-2 text-[0.875rem] leading-relaxed text-slate-500">
                  {f.desc}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {f.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-md bg-slate-100 px-2 py-0.5 text-[0.6875rem] font-medium text-slate-500"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 6. BENEFÍCIOS                                                      */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section className="bg-slate-50/60 py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <h2 className="mx-auto max-w-lg text-center text-[clamp(1.75rem,3.5vw,2.5rem)] font-bold leading-tight tracking-tight text-slate-900">
            Por que profissionais escolhem o{" "}
            <span className="italic text-blue-700" style={SERIF}>
              Cliniq
            </span>
          </h2>

          <div className="mx-auto mt-12 grid max-w-4xl gap-8 sm:grid-cols-2 md:grid-cols-3">
            {[
              {
                icon: "⚡",
                title: "Pronto em 5 minutos",
                desc: "Crie sua conta, cadastre um paciente e agende. Sem manual, sem treinamento.",
              },
              {
                icon: "🔒",
                title: "Dados separados por clínica",
                desc: "Cada clínica visualiza apenas as próprias informações em um ambiente protegido.",
              },
              {
                icon: "📱",
                title: "Acesse de qualquer lugar",
                desc: "Funciona no celular, tablet e computador. Basta abrir o navegador.",
              },
              {
                icon: "🚫",
                title: "Sem contrato ou fidelidade",
                desc: "Assine mês a mês. Se não gostar, cancele sem burocracia.",
              },
              {
                icon: "🇧🇷",
                title: "Feito no Brasil",
                desc: "Pensado para clínicas brasileiras. Interface e suporte em português.",
              },
              {
                icon: "💬",
                title: "Suporte real, não robô",
                desc: "Fale direto com quem desenvolveu o sistema. Resposta rápida pelo WhatsApp.",
              },
            ].map((b) => (
              <div key={b.title} className="text-center">
                <span className="text-3xl">{b.icon}</span>
                <p className="mt-3 text-[0.9375rem] font-semibold text-slate-900">
                  {b.title}
                </p>
                <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-slate-500">
                  {b.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 7. CTA INTERMEDIÁRIO                                               */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-14">
        <div className="mx-auto max-w-2xl px-5 text-center sm:px-8">
          <p className="text-lg font-bold text-slate-900">
            Quer ver o sistema funcionando?
          </p>
          <p className="mt-1 text-[0.9375rem] text-slate-500">
            Uma demonstração de 15 minutos mostra como o Cliniq pode organizar a
            rotina da sua clínica.
          </p>
          <div className="mt-5">
            <DemoCTA label="Agendar demonstração gratuita" />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 8. ACESSO ANTECIPADO / BETA                                        */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section className="bg-blue-50/40 py-20 md:py-28">
        <div className="mx-auto max-w-4xl px-5 text-center sm:px-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-4 py-1.5">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-teal-500" />
            <span className="text-[0.8125rem] font-medium text-teal-700">
              Acesso antecipado
            </span>
          </div>

          <h2 className="mt-3 text-[clamp(1.5rem,3vw,2.25rem)] font-bold leading-tight tracking-tight text-slate-900">
            Estamos abrindo as primeiras vagas.
            <br />E isso é uma{" "}
            <span className="italic text-blue-700" style={SERIF}>
              vantagem
            </span>{" "}
            para você.
          </h2>

          <p className="mx-auto mt-4 max-w-xl text-[0.9375rem] leading-relaxed text-slate-500">
            Os primeiros clientes do Cliniq terão onboarding próximo, canal
            direto com o time e condição especial de lançamento.
          </p>

          <div className="mx-auto mt-10 grid max-w-3xl gap-5 sm:grid-cols-3">
            {[
              {
                icon: "🎁",
                title: "Condição de fundador",
                desc: "Quem entrar agora garante valor especial de lançamento no plano.",
              },
              {
                icon: "🎤",
                title: "Canal direto com o time",
                desc: "Sugira melhorias, reporte ajustes e acompanhe a evolução do produto de perto.",
              },
              {
                icon: "🤝",
                title: "Onboarding personalizado",
                desc: "A gente configura o sistema junto com você, sem custo extra.",
              },
            ].map((perk) => (
              <div
                key={perk.title}
                className="rounded-xl border border-slate-200/80 bg-white p-5 text-left"
              >
                <span className="text-2xl">{perk.icon}</span>
                <p className="mt-3 text-[0.9375rem] font-semibold text-slate-900">
                  {perk.title}
                </p>
                <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-slate-500">
                  {perk.desc}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <DemoCTA label="Quero participar do beta" />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 9. PLANOS                                                          */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section id="planos" className="py-20 md:py-28 [scroll-margin-top:96px]">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <p className="text-[0.8125rem] font-semibold uppercase tracking-widest text-teal-600">
              Planos
            </p>

            <h2 className="mt-3 text-[clamp(1.75rem,3.5vw,2.5rem)] font-bold leading-tight tracking-tight text-slate-900">
              Escolha o plano do seu{" "}
              <span className="italic text-blue-700" style={SERIF}>
                momento
              </span>
            </h2>

            <p className="mt-3 text-[0.9375rem] text-slate-500">
              Todos incluem 14 dias grátis. Sem cartão de crédito.
            </p>
          </div>

          <div className="mx-auto grid max-w-4xl gap-5 md:grid-cols-3">
            {/* Essencial */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <p className="text-[0.9375rem] font-semibold text-slate-900">
                Essencial
              </p>
              <p className="mt-0.5 text-[0.8125rem] text-slate-400">
                Profissional solo
              </p>

              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-bold tracking-tight text-slate-900">
                  R$49
                </span>
                <span className="text-sm text-slate-400">/mês</span>
              </div>

              <ul className="mt-6 space-y-2.5 text-[0.8125rem] text-slate-600">
                <li className="flex items-center gap-2">
                  <Check /> 1 profissional
                </li>
                <li className="flex items-center gap-2">
                  <Check /> Até 100 pacientes
                </li>
                <li className="flex items-center gap-2">
                  <Check /> 200 agendamentos/mês
                </li>
                <li className="flex items-center gap-2">
                  <Check /> Dashboard completo
                </li>
                <li className="flex items-center gap-2">
                  <Check /> Agenda dia e semana
                </li>
                <li className="flex items-center gap-2">
                  <Check /> Gestão de leads
                </li>
                <li className="flex items-center gap-2">
                  <Check /> Financeiro básico
                </li>
              </ul>

              <div className="mt-6">
                <DemoCTA
                  variant="outline"
                  label="Agendar demonstração"
                  className="!w-full !justify-center"
                />
              </div>
            </div>

            {/* Profissional */}
            <div
              className="relative rounded-2xl border-2 border-blue-600 bg-white p-6"
              style={{ boxShadow: "0 8px 32px rgba(29,78,216,0.1)" }}
            >
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-700 px-3 py-0.5 text-[0.6875rem] font-semibold text-white">
                RECOMENDADO
              </span>

              <p className="text-[0.9375rem] font-semibold text-blue-700">
                Profissional
              </p>
              <p className="mt-0.5 text-[0.8125rem] text-slate-400">
                Até 3 profissionais
              </p>

              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-bold tracking-tight text-blue-700">
                  R$99
                </span>
                <span className="text-sm text-slate-400">/mês</span>
              </div>

              <ul className="mt-6 space-y-2.5 text-[0.8125rem] text-slate-600">
                <li className="flex items-center gap-2">
                  <Check /> 3 profissionais
                </li>
                <li className="flex items-center gap-2">
                  <Check /> Até 500 pacientes
                </li>
                <li className="flex items-center gap-2">
                  <Check /> 1.000 agendamentos/mês
                </li>
                <li className="flex items-center gap-2">
                  <Check /> Tudo do Essencial
                </li>
                <li className="flex items-center gap-2">
                  <Check /> Financeiro completo
                </li>
                <li className="flex items-center gap-2">
                  <Check /> Prontuário por consulta
                </li>
                <li className="flex items-center gap-2">
                  <Check /> Equipe e permissões
                </li>
              </ul>

              <div className="mt-6">
                <DemoCTA
                  label="Agendar demonstração"
                  className="!w-full !justify-center !shadow-md !shadow-blue-700/20"
                />
              </div>
            </div>

            {/* Clínica */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <p className="text-[0.9375rem] font-semibold text-slate-900">
                Clínica
              </p>
              <p className="mt-0.5 text-[0.8125rem] text-slate-400">
                Equipe completa
              </p>

              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-bold tracking-tight text-slate-900">
                  R$199
                </span>
                <span className="text-sm text-slate-400">/mês</span>
              </div>

              <ul className="mt-6 space-y-2.5 text-[0.8125rem] text-slate-600">
                <li className="flex items-center gap-2">
                  <Check /> Profissionais ilimitados
                </li>
                <li className="flex items-center gap-2">
                  <Check /> Pacientes ilimitados
                </li>
                <li className="flex items-center gap-2">
                  <Check /> Agendamentos ilimitados
                </li>
                <li className="flex items-center gap-2">
                  <Check /> Tudo do Profissional
                </li>
                <li className="flex items-center gap-2">
                  <Check /> Suporte prioritário
                </li>
              </ul>

              <div className="mt-6">
                <DemoCTA
                  variant="outline"
                  label="Agendar demonstração"
                  className="!w-full !justify-center"
                />
              </div>
            </div>
          </div>

          <p className="mt-8 text-center text-[0.8125rem] text-slate-400">
            Todos os planos incluem 14 dias grátis. Sem cartão de crédito.
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 10. FAQ                                                            */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section
        id="faq"
        className="bg-slate-50/60 py-20 md:py-28 [scroll-margin-top:96px]"
      >
        <div className="mx-auto max-w-2xl px-5 sm:px-8">
          <h2 className="mb-10 text-center text-[clamp(1.5rem,3vw,2.25rem)] font-bold tracking-tight text-slate-900">
            Perguntas frequentes
          </h2>

          <div className="space-y-3">
            {[
              {
                q: "Para quem o Cliniq é ideal?",
                a: "Para profissionais da saúde que trabalham sozinhos ou em clínicas com até 3 pessoas na equipe. Esteticistas, fisioterapeutas, nutricionistas, psicólogos e personal trainers são o público principal.",
              },
              {
                q: "Preciso de cartão para testar?",
                a: "Não. O trial de 14 dias é grátis e não pedimos dados de pagamento. Você decide se quer assinar depois.",
              },
              {
                q: "Consigo cancelar a qualquer momento?",
                a: "Sim. Não tem multa, contrato ou fidelidade. Cancele quando quiser, direto nas configurações.",
              },
              {
                q: "Meus dados de pacientes ficam seguros?",
                a: "Sim. Os dados de cada clínica ficam separados, e o sistema roda em ambiente protegido com controle de acesso.",
              },
              {
                q: "Funciona no celular?",
                a: "Funciona. O Cliniq abre em qualquer navegador, no celular, tablet ou computador. Não precisa instalar nada.",
              },
              {
                q: "Preciso entender de tecnologia?",
                a: "Nenhum conhecimento técnico. Se você usa WhatsApp, consegue usar o Cliniq. Ele foi feito para profissionais de saúde, não programadores.",
              },
              {
                q: "O Cliniq já está funcionando?",
                a: "Sim. O sistema está funcional e estamos em fase de acesso antecipado com os primeiros clientes. Agende uma demonstração para ver como funciona.",
              },
            ].map((faq) => (
              <details
                key={faq.q}
                className="group rounded-xl border border-slate-200 bg-white [&_summary::-webkit-details-marker]:hidden"
              >
                <summary className="flex cursor-pointer items-center justify-between px-5 py-4">
                  <span className="pr-4 text-[0.9375rem] font-semibold text-slate-900">
                    {faq.q}
                  </span>
                  <span className="flex-shrink-0 text-lg text-slate-400 transition group-open:rotate-45">
                    +
                  </span>
                </summary>
                <div className="px-5 pb-4 text-[0.875rem] leading-relaxed text-slate-500">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 11. CTA FINAL                                                      */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-4xl px-5 sm:px-8">
          <div
            className="relative overflow-hidden rounded-3xl p-8 text-center sm:p-12"
            style={{
              background:
                "linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 50%, #0d9488 100%)",
            }}
          >
            <div
              className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full"
              style={{ background: "rgba(255,255,255,0.04)" }}
            />
            <div
              className="pointer-events-none absolute -bottom-16 -left-8 h-40 w-40 rounded-full"
              style={{ background: "rgba(255,255,255,0.02)" }}
            />

            <h2 className="relative text-[clamp(1.5rem,3vw,2.25rem)] font-bold leading-snug tracking-tight text-white">
              Sua clínica pode começar a se
              <br />
              organizar{" "}
              <span className="italic" style={SERIF}>
                hoje
              </span>
              .
            </h2>

            <p className="relative mx-auto mt-3 max-w-md text-[0.9375rem] text-white/70">
              Agende uma demonstração de 15 minutos e veja o Cliniq funcionando
              na prática para a rotina da sua clínica.
            </p>

            <div className="relative mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <DemoCTA variant="white" label="Agendar pelo WhatsApp" />
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-6 py-3.5 text-[0.9375rem] font-medium text-white transition hover:bg-white/10"
              >
                Ou testar grátis agora
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* FOOTER                                                             */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <footer className="bg-slate-900 pb-6 pt-12 text-slate-400">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="grid gap-8 border-b border-white/5 pb-8 md:grid-cols-4">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-600">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2.5"
                  >
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4" />
                  </svg>
                </div>
                <span className="text-sm font-bold text-white">Cliniq</span>
              </div>
              <p className="text-[0.8125rem] leading-relaxed">
                Gestão simples para clínicas pequenas e profissionais da saúde.
              </p>
            </div>

            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-white/30">
                Produto
              </p>
              <div className="space-y-2 text-[0.8125rem]">
                <a
                  href="#funcionalidades"
                  className="block transition hover:text-white"
                >
                  Funcionalidades
                </a>
                <a href="#planos" className="block transition hover:text-white">
                  Planos
                </a>
                <a href="#faq" className="block transition hover:text-white">
                  FAQ
                </a>
              </div>
            </div>

            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-white/30">
                Contato
              </p>
              <div className="space-y-2 text-[0.8125rem]">
                <a
                  href={WA_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block transition hover:text-white"
                >
                  WhatsApp
                </a>
                <a
                  href="https://instagram.com/yamaji.studio"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block transition hover:text-white"
                >
                  Instagram
                </a>
              </div>
            </div>

            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-white/30">
                Legal
              </p>
              <div className="space-y-2 text-[0.8125rem]">
                <a href="/termos" className="block transition hover:text-white">
                  Termos de uso
                </a>
                <a
                  href="/privacidade"
                  className="block transition hover:text-white"
                >
                  Privacidade
                </a>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center justify-between gap-3 pt-6 md:flex-row">
            <span className="text-xs text-slate-500">
              © 2026 Cliniq. Todos os direitos reservados.
            </span>

            <span className="text-xs text-white/20">
              Cliniq é um produto desenvolvido pela{" "}
              <a
                href="https://yamaji.studio"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/30 underline transition hover:text-white/50"
              >
                Yamaji Studio
              </a>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
