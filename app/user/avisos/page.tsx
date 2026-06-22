"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';

export const dynamic = 'force-dynamic';

interface Aviso {
    id: number;
    titulo: string;
    conteudo: string;
    importante: boolean;
    criado_em: string;
}

export default function QuadroAvisosPage() {
    const [avisos, setAvisos] = useState<Aviso[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [permissaoPush, setPermissaoPush] = useState<string>('default');

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    useEffect(() => {
        if (typeof window !== 'undefined' && 'Notification' in window) {
            setPermissaoPush(window.Notification.permission);
        }
    }, []);

    const carregarAvisosMural = async () => {
        setCarregando(true);
        try {
            // Fará a requisição pública usando a role anon autorizada pela nova política
            const { data, error } = await supabase
                .from('avisos')
                .select('*')
                .order('criado_em', { ascending: false });

            if (data) setAvisos(data as Aviso[]);
            if (error) throw error;
        } catch (err) {
            console.error("Erro ao puxar mural de avisos:", err);
        } finally {
            setCarregando(false);
        }
    };

    useEffect(() => {
        carregarAvisosMural();
    }, []);

    const handleAtivarNotificacoes = async () => {
        if (typeof window === 'undefined' || !('Notification' in window)) {
            alert("Este dispositivo ou navegador não suporta notificações Push locais.");
            return;
        }

        try {
            const permission = await window.Notification.requestPermission();
            setPermissaoPush(permission);

            if (permission === 'granted') {
                // Teste de disparo imediato após interação do clique do trabalhador
                new window.Notification("GR Autopeças", {
                    body: "Notificações ativadas! Os avisos de pátio serão exibidos aqui.",
                    requireInteraction: true // Força o banner a ficar visível no Android
                });
            } else if (permission === 'denied') {
                alert("As notificações foram bloqueadas nas configurações do seu celular. Altere as permissões do navegador.");
            }
        } catch (error) {
            console.error("Erro ao solicitar permissão de avisos:", error);
        }
    };

    return (
        <main className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f] p-4 sm:p-6 md:p-10 font-sans antialiased flex flex-col justify-between w-full selection:bg-orange-500/10">
            <div className="w-full max-w-3xl mx-auto flex-1 flex flex-col gap-6">

                {/* CABEÇALHO */}
                <header className="space-y-1.5 pl-1 border-b border-[#e5e5ea] pb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <Link href="/user" className="text-[10px] font-bold uppercase tracking-wider text-[#86868b] hover:text-orange-600 transition-colors block">
                            ← Voltar Pro Menu Principal
                        </Link>
                        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#1d1d1f]">
                            Comunicados &amp; Alertas de Pátio
                        </h1>
                    </div>

                    {permissaoPush !== 'granted' ? (
                        <button
                            onClick={handleAtivarNotificacoes}
                            className="bg-[#007aff] hover:bg-[#0066d6] text-white px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95 shadow-sm shrink-0"
                        >
                            🔔 Ativar Notificações no Celular
                        </button>
                    ) : (
                        <span className="bg-[#34c759]/10 border border-[#34c759]/20 text-[#248a3d] px-3 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-wider select-none">
                            🟢 Alertas Ativos no Dispositivo
                        </span>
                    )}
                </header>

                {/* MURAL DE HISTÓRICO */}
                <section className="flex-1 flex flex-col gap-4">
                    {carregando ? (
                        <div className="text-center py-20 flex flex-col items-center justify-center gap-2 text-[#86868b]">
                            <div className="w-5 h-5 border-2 border-[#1d1d1f] border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-[10px] uppercase font-bold tracking-wider font-mono">Buscando mural da empresa...</span>
                        </div>
                    ) : avisos.length === 0 ? (
                        <div className="bg-white border border-[#e5e5ea] rounded-2xl p-12 text-center shadow-[0_1px_3px_rgba(0,0,0,0.01)] flex items-center justify-center min-h-[200px]">
                            <p className="text-xs text-[#86868b] font-bold uppercase tracking-wide">Nenhum comunicado oficial lançado recentemente.</p>
                        </div>
                    ) : (
                        avisos.map((aviso) => (
                            <div
                                key={aviso.id}
                                className={`bg-white border p-5 sm:p-6 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.005)] relative overflow-hidden transition-all hover:shadow-[0_4px_12px_rgba(0,0,0,0.015)] ${
                                    aviso.importante ? 'border-red-200 bg-red-50/[0.15]' : 'border-[#e5e5ea]'
                                }`}
                            >
                                <div className="flex justify-between items-start gap-4 mb-2 select-none">
                                    <div className="flex items-center gap-2">
                                        {aviso.importante && (
                                            <span className="text-[8px] font-black uppercase tracking-wider bg-red-500 text-white px-2 py-0.5 rounded animate-pulse">
                                                Urgente
                                            </span>
                                        )}
                                        <h3 className="text-sm font-bold text-[#1d1d1f] uppercase tracking-tight leading-tight">
                                            {aviso.titulo}
                                        </h3>
                                    </div>
                                    <span className="font-mono text-[9px] font-bold text-[#86868b] bg-[#f5f5f7] px-2 py-0.5 rounded shrink-0">
                                        {new Date(aviso.criado_em).toLocaleDateString('pt-BR')}
                                    </span>
                                </div>

                                <p className="text-xs text-[#424245] font-medium leading-relaxed whitespace-pre-wrap uppercase tracking-wide">
                                    {aviso.conteudo}
                                </p>
                            </div>
                        ))
                    )}
                </section>
            </div>

            {/* FOOTER */}
            <footer className="w-full max-w-3xl mx-auto border-t border-[#e5e5ea] pt-5 mt-8 text-[8px] text-[#86868b] uppercase font-bold tracking-wider text-center select-none">
                <div>GR Autopeças &amp; Serviços • Mural Eletrônico v1.1</div>
            </footer>
        </main>
    );
}