"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';

export const dynamic = 'force-dynamic';

export default function CrachaVirtualPage() {
    const router = useRouter();
    const [colaboradorId, setColaboradorId] = useState<string | null>(null);
    const [colaboradorNome, setColaboradorNome] = useState<string>('---');
    const [cargo, setCargo] = useState<string>('---');
    const [carregando, setCarregando] = useState(true);
    const [rotacionado, setRotacionado] = useState(false);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    useEffect(() => {
        const idLocal = localStorage.getItem('gr_colaborador_id');
        const nomeLocal = localStorage.getItem('gr_colaborador_nome');

        if (!idLocal) {
            router.push('/');
            return;
        }

        setColaboradorId(idLocal);
        if (nomeLocal) setColaboradorNome(nomeLocal);
    }, [router]);

    useEffect(() => {
        if (!colaboradorId) return;

        const buscarDadosContratuais = async () => {
            setCarregando(true);
            try {
                const { data, error } = await supabase
                    .from('funcionarios')
                    .select('cargo, nome, sobrenome')
                    .eq('id', colaboradorId)
                    .single();

                if (data) {
                    setCargo(data.cargo);
                    setColaboradorNome(`${data.nome} ${data.sobrenome}`);
                }
                if (error) throw error;
            } catch (err) {
                console.error("Erro ao puxar dados do crachá:", err);
            } finally {
                setCarregando(false);
            }
        };

        buscarDadosContratuais();
    }, [colaboradorId, supabase]);

    return (
        <main className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f] p-4 sm:p-6 md:p-10 font-sans antialiased flex flex-col justify-between w-full selection:bg-orange-500/10">

            <div className="w-full max-w-sm mx-auto flex-1 flex flex-col justify-center gap-6">

                {/* CABEÇALHO */}
                <div className="text-left pl-1">
                    <Link href="/user" className="text-[10px] font-bold uppercase tracking-wider text-[#86868b] hover:text-orange-600 transition-colors">
                        ← Menu Principal
                    </Link>
                </div>

                {carregando ? (
                    <div className="h-[420px] bg-white border border-[#e5e5ea] rounded-3xl flex flex-col items-center justify-center gap-2 text-[#86868b] shadow-sm">
                        <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-[9px] font-mono font-bold uppercase tracking-wider">Gerando ID Card...</span>
                    </div>
                ) : (
                    /* CONTAINER DE PERSPECTIVA 3D */
                    <div className="w-full h-[450px] [perspective:1000px] cursor-pointer" onClick={() => setRotacionado(!rotacionado)}>

                        {/* CARD FLIPPER */}
                        <div className={`w-full h-full relative transition-transform duration-700 [transform-style:preserve-3d] ${rotacionado ? '[transform:rotateY(180deg)]' : ''}`}>

                            {/* LADO A: FRENTE DO CRACHÁ */}
                            <div className="absolute w-full h-full rounded-3xl bg-white border border-[#e5e5ea] shadow-[0_4px_20px_rgba(0,0,0,0.03)] [backface-visibility:hidden] p-6 flex flex-col justify-between overflow-hidden">

                                {/* Marca d'água decorativa */}
                                <div className="absolute right-[-20px] top-[-20px] text-[130px] opacity-[0.02] font-black select-none pointer-events-none italic">GR</div>

                                {/* Topo do Crachá */}
                                <div className="flex justify-between items-start border-b border-[#f5f5f7] pb-4 select-none">
                                    <div className="space-y-0.5">
                                        <h2 className="text-xs font-black tracking-wider uppercase text-[#1d1d1f]">GR Autopeças</h2>
                                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest font-mono">Identificação</p>
                                    </div>
                                    <span className="text-[7px] font-black tracking-widest bg-orange-500 text-white px-1.5 py-0.5 rounded uppercase">
                                        Pátio
                                    </span>
                                </div>

                                {/* Foto / Avatar */}
                                <div className="flex flex-col items-center justify-center my-auto space-y-4">
                                    <div className="w-24 h-24 rounded-2xl bg-[#f5f5f7] border border-[#e5e5ea] flex items-center justify-center text-3xl shadow-inner select-none uppercase font-black text-slate-400">
                                        {colaboradorNome.charAt(0)}
                                    </div>

                                    <div className="text-center space-y-1">
                                        <h3 className="text-base font-bold text-[#1d1d1f] uppercase tracking-tight leading-tight">
                                            {colaboradorNome}
                                        </h3>
                                        <p className="text-[10px] font-black text-orange-600 uppercase tracking-wide">
                                            {cargo}
                                        </p>
                                    </div>
                                </div>

                                {/* Base do Crachá */}
                                <div className="border-t border-[#f5f5f7] pt-4 flex justify-between items-center select-none">
                                    <div>
                                        <p className="text-[7px] font-bold text-slate-400 uppercase tracking-wider leading-none">Matrícula ID</p>
                                        <span className="font-mono text-xs font-black text-[#1d1d1f] mt-1 block">#{colaboradorId}</span>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[7px] font-bold text-slate-400 uppercase tracking-wider leading-none">Emissão</p>
                                        <span className="font-mono text-[10px] font-bold text-slate-700 mt-1 block">2026</span>
                                    </div>
                                </div>
                            </div>

                            {/* LADO B: VERSO DO CRACHÁ */}
                            <div className="absolute w-full h-full rounded-3xl bg-[#1d1d1f] text-white shadow-[0_4px_20px_rgba(0,0,0,0.03)] [backface-visibility:hidden] [transform:rotateY(180deg)] p-6 flex flex-col justify-between overflow-hidden border border-white/5">

                                {/* Tarja Magnética Estilizada */}
                                <div className="absolute left-0 top-8 w-full h-10 bg-black/60 select-none"></div>

                                <div className="mt-16 space-y-4 flex-1">
                                    <div className="space-y-1">
                                        <p className="text-[8px] font-black uppercase text-orange-500 tracking-wider">Propriedade Institucional</p>
                                        <p className="text-[10px] text-slate-300 font-medium leading-relaxed uppercase text-justify">
                                            Este documento virtual comprova o vínculo operacional com a GR Autopeças LTDA. O uso é pessoal e intransferível para fins de verificação interna nas dependências de pátio e almoxarifado.
                                        </p>
                                    </div>

                                    <div className="space-y-1">
                                        <p className="text-[8px] font-black uppercase text-orange-500 tracking-wider">Suporte de TI / RH</p>
                                        <p className="text-[9px] text-slate-400 font-mono">
                                            Dúvidas ou inconsistências cadastrais devem ser reportadas diretamente à gerência administrativa de Arapiraca - AL.
                                        </p>
                                    </div>
                                </div>

                                <div className="border-t border-white/10 pt-4 text-center select-none">
                                    <p className="text-[7px] font-mono tracking-widest text-slate-500 uppercase">
                                        GR Cluster Core Security System v3.1
                                    </p>
                                </div>
                            </div>

                        </div>
                    </div>
                )}

                {/* Legenda de ação interativa */}
                <p className="text-center text-[9px] font-bold uppercase tracking-wider text-[#86868b] select-none">
                    💡 Toque no crachá para ver o verso
                </p>
            </div>

            {/* FOOTER */}
            <footer className="w-full max-w-sm mx-auto border-t border-[#e5e5ea] pt-5 mt-8 text-[8px] text-[#86868b] uppercase font-bold tracking-wider text-center select-none">
                <div>GR Autopeças &amp; Serviços</div>
            </footer>
        </main>
    );
}