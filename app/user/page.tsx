"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function UserHubPage() {
    const router = useRouter();
    const [colaboradorNome, setColaboradorNome] = useState<string>('Colaborador');

    // Garante a validação da sessão assim como no espelho de ponto
    useEffect(() => {
        const idLocal = localStorage.getItem('gr_colaborador_id');
        const nomeLocal = localStorage.getItem('gr_colaborador_nome');

        if (!idLocal) {
            router.push('/');
            return;
        }

        if (nomeLocal) setColaboradorNome(nomeLocal);

        // DISPARO DE PUSH AUTOMÁTICO NO NAVEGADOR DO CELULAR
        const dispararPedidoNotificacao = async () => {
            if (typeof window !== 'undefined' && 'Notification' in window) {
                if (window.Notification.permission === 'default') {
                    try {
                        const permissao = await window.Notification.requestPermission();
                        if (permissao === 'granted') {
                            new window.Notification("GR Autopeças", {
                                body: "Painel operacional conectado. Você receberá os alertas de pátio por aqui!",
                            });
                        }
                    } catch (err) {
                        console.error("Falha ao inicializar Web Push API no dispositivo:", err);
                    }
                }
            }
        };

        dispararPedidoNotificacao();
    }, [router]);

    const handleDesconectar = () => {
        localStorage.clear();
        router.push('/');
    };

    return (
        <main className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f] p-4 sm:p-6 md:p-10 font-sans antialiased flex flex-col justify-between w-full selection:bg-orange-500/10">
            <div className="w-full max-w-5xl mx-auto flex-1 flex flex-col justify-center gap-8">

                {/* SAUDAÇÃO */}
                <header className="text-center space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-orange-600 font-mono">
                        Painel Operacional
                    </p>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1d1d1f]">
                        Olá, {colaboradorNome}!
                    </h1>
                    <p className="text-xs text-[#86868b] font-medium max-w-md mx-auto">
                        Selecione um dos módulos abaixo para gerenciar suas atividades no pátio ou consultar seus dados.
                    </p>
                </header>

                {/* GRID DE OPÇÕES ATUALIZADO PARA 3 COLUNAS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">

                    {/* CARD: ESPELHO DE PONTO */}
                    <Link
                        href="/user/ponto"
                        className="bg-white border border-[#e5e5ea] rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.01)] transition-all hover:shadow-[0_8px_24px_rgba(0,0,0,0.04)] hover:border-orange-500/30 flex flex-col justify-between group min-h-[140px]"
                    >
                        <div className="space-y-1.5">
                            <div className="text-xl group-hover:scale-110 transition-transform w-fit select-none">⏱️</div>
                            <h2 className="text-sm font-bold text-[#1d1d1f] uppercase tracking-tight">
                                Espelho de Ponto
                            </h2>
                            <p className="text-[11px] text-[#86868b] font-medium leading-relaxed">
                                Consulte suas batidas diárias, horas extras, intervalos e imprima sua folha mensal.
                            </p>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#86868b] group-hover:text-orange-600 transition-colors mt-4 block">
                            Acessar Cartão →
                        </span>
                    </Link>

                    {/* CARD: MURAL DE AVISOS */}
                    <Link
                        href="/user/avisos"
                        className="bg-white border border-[#e5e5ea] rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.01)] transition-all hover:shadow-[0_8px_24px_rgba(0,0,0,0.04)] hover:border-orange-500/30 flex flex-col justify-between group min-h-[140px]"
                    >
                        <div className="space-y-1.5">
                            <div className="text-xl group-hover:scale-110 transition-transform w-fit select-none">🔔</div>
                            <h2 className="text-sm font-bold text-[#1d1d1f] uppercase tracking-tight">
                                Avisos &amp; Alertas
                            </h2>
                            <p className="text-[11px] text-[#86868b] font-medium leading-relaxed">
                                Fique por dentro dos comunicados oficiais da empresa e alertas urgentes de pátio.
                            </p>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#86868b] group-hover:text-orange-600 transition-colors mt-4 block">
                            Ver Comunicados →
                        </span>
                    </Link>

                    {/* NOVO CARD: CRACHÁ VIRTUAL */}
                    <Link
                        href="/user/cracha"
                        className="bg-white border border-[#e5e5ea] rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.01)] transition-all hover:shadow-[0_8px_24px_rgba(0,0,0,0.04)] hover:border-orange-500/30 flex flex-col justify-between group min-h-[140px] sm:col-span-2 lg:col-span-1"
                    >
                        <div className="space-y-1.5">
                            <div className="text-xl group-hover:scale-110 transition-transform w-fit select-none">🪪</div>
                            <h2 className="text-sm font-bold text-[#1d1d1f] uppercase tracking-tight">
                                Crachá Digital
                            </h2>
                            <p className="text-[11px] text-[#86868b] font-medium leading-relaxed">
                                Exiba sua identificação funcional eletrônica com dados de matrícula e cargo em tempo real.
                            </p>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#86868b] group-hover:text-orange-600 transition-colors mt-4 block">
                            Visualizar ID →
                        </span>
                    </Link>

                </div>

                {/* BOTÃO DE LOGOUT */}
                <div className="flex justify-center mt-2">
                    <button
                        onClick={handleDesconectar}
                        className="text-red-600 bg-red-50 hover:bg-red-100/70 border border-red-200/60 px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all active:scale-95"
                    >
                        🚪 Encerrar Sessão
                    </button>
                </div>

            </div>

            {/* FOOTER */}
            <footer className="w-full max-w-5xl mx-auto border-t border-[#e5e5ea] pt-5 mt-8 text-[8px] text-[#86868b] uppercase font-bold tracking-wider text-center select-none">
                <div>GR Autopeças &amp; Serviços • Painel Central v1.2</div>
            </footer>
        </main>
    );
}