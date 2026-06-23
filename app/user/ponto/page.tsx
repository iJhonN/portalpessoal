"use client";
import { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';

export const dynamic = 'force-dynamic';

interface RegistroPonto {
    id: number;
    funcionario_id: string;
    data_registro: string;
    hora_formatada: string;
    tipo_batida: string;
    observacao: string;
}

interface RegistroPausa {
    id: number;
    funcionario_id: string;
    data: string;
    minutos_ajuste: number;
    tipo: string;
    observacao: string;
}

interface SaidaEmergency {
    id: string;
    funcionario_id: string;
    horario_saida: string;
    horario_retorno: string | null;
    justificativa: string;
}

interface HoraExtraManual {
    id: number;
    funcionario_id: string;
    data_referencia: string;
    minutos_diurnos: number;
    minutos_noturnos: number;
}

interface BancoHorasMovimentacao {
    id: number;
    funcionario_id: string;
    data_evento: string;
    minutos_ajuste: number;
    tipo_hora: 'DIURNA' | 'NOTURNA';
    motivo: string;
}

interface DiaCompetencia {
    dia: number;
    mes: number;
    ano: number;
    label: string;
    diaSemanaLabel: string;
    isFimDeSemana: boolean;
    isDomingo: boolean;
}

function EspelhoPontoConteudo() {
    const router = useRouter();
    const [colaboradorId, setColaboradorId] = useState<string | null>(null);
    const [colaboradorNome, setColaboradorNome] = useState<string>('Colaborador');
    const [cargo, setCargo] = useState<string>('---');

    const [pontos, setPontos] = useState<RegistroPonto[]>([]);
    const [pausas, setPausas] = useState<RegistroPausa[]>([]);
    const [saidasEmergencia, setSaidasEmergencia] = useState<SaidaEmergency[]>([]);
    const [extrasManuais, setExtrasManuais] = useState<HoraExtraManual[]>([]);
    const [bancoHoras, setBancoHoras] = useState<BancoHorasMovimentacao[]>([]);
    const [carregando, setCarregando] = useState(true);

    const dataAtual = new Date();
    const mesInicial = dataAtual.getDate() > 15 ? dataAtual.getMonth() + 2 : dataAtual.getMonth() + 1;
    const [mesSelecionado, setMesSelecionado] = useState(mesInicial > 12 ? 1 : mesInicial);
    const [anoSelecionado, setAnoSelecionado] = useState(mesInicial > 12 ? dataAtual.getFullYear() + 1 : dataAtual.getFullYear());

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

        const carregarDadosIndividuais = async () => {
            setCarregando(true);
            try {
                const [resFunc, resPontos, resPausas, resSaidas, resExtras, resBanco] = await Promise.all([
                    supabase.from('funcionarios').select('cargo').eq('id', colaboradorId).single(),
                    supabase.from('pontos').select('id, funcionario_id, data_registro, hora_formatada, tipo_batida, observacao').eq('funcionario_id', colaboradorId),
                    supabase.from('pausas').select('id, funcionario_id, data, minutos_ajuste, tipo, observacao').eq('funcionario_id', colaboradorId),
                    supabase.from('saidas_emergencia').select('id, funcionario_id, horario_saida, horario_retorno, justificativa').eq('funcionario_id', colaboradorId),
                    supabase.from('horas_extras').select('id, funcionario_id, data_referencia, minutos_diurnos, minutos_noturnos').eq('funcionario_id', colaboradorId),
                    supabase.from('banco_horas').select('id, funcionario_id, data_evento, minutos_ajuste, tipo_hora, motivo').eq('funcionario_id', colaboradorId)
                ]);

                if (resFunc.data) setCargo(resFunc.data.cargo);
                if (resPontos.data) setPontos(resPontos.data as RegistroPonto[]);
                if (resPausas.data) setPausas(resPausas.data as RegistroPausa[]);
                if (resSaidas.data) setSaidasEmergencia(resSaidas.data as SaidaEmergency[]);
                if (resExtras.data) setExtrasManuais(resExtras.data as HoraExtraManual[]);
                if (resBanco.data) setBancoHoras(resBanco.data as BancoHorasMovimentacao[]);
            } catch (error) {
                console.error("Erro ao sincronizar espelho de ponto:", error);
            } finally {
                setCarregando(false);
            }
        };

        carregarDadosIndividuais();
    }, [colaboradorId, supabase]);

    const diasDoCiclo = useMemo((): DiaCompetencia[] => {
        const listaDias: DiaCompetencia[] = [];
        const labelsSemana = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

        let mesAnterior = mesSelecionado - 1;
        let anoAnterior = anoSelecionado;
        if (mesAnterior === 0) {
            mesAnterior = 12;
            anoAnterior = anoSelecionado - 1;
        }

        const totalDiasMesAnterior = new Date(anoAnterior, mesAnterior, 0).getDate();

        for (let d = 16; d <= totalDiasMesAnterior; d++) {
            const dataObjeto = new Date(anoAnterior, mesAnterior - 1, d);
            const numDiaSemana = dataObjeto.getDay();
            listaDias.push({
                dia: d, mes: mesAnterior, ano: anoAnterior,
                label: `${String(d).padStart(2, '0')}/${String(mesAnterior).padStart(2, '0')}`,
                diaSemanaLabel: labelsSemana[numDiaSemana],
                isFimDeSemana: numDiaSemana === 0 || numDiaSemana === 6,
                isDomingo: numDiaSemana === 0
            });
        }

        for (let d = 1; d <= 15; d++) {
            const dataObjeto = new Date(anoSelecionado, mesSelecionado - 1, d);
            const numDiaSemana = dataObjeto.getDay();
            listaDias.push({
                dia: d, mes: mesSelecionado, ano: anoSelecionado,
                label: `${String(d).padStart(2, '0')}/${String(mesSelecionado).padStart(2, '0')}`,
                diaSemanaLabel: labelsSemana[numDiaSemana],
                isFimDeSemana: numDiaSemana === 0 || numDiaSemana === 6,
                isDomingo: numDiaSemana === 0
            });
        }
        return listaDias;
    }, [mesSelecionado, anoSelecionado]);

    // MAPA DE DADOS COPIADO 1:1 DA SUA BASE QUE FUNCIONA PERFEITAMENTE
    const mapaDadosAgrupados = useMemo(() => {
        const mapa: {
            [chave: string]: {
                pontos: RegistroPonto[];
                minutosPausa: number;
                textoAjuste: string;
                emergenciaSaida: string;
                emergenciaRetorno: string;
                emergenciaDuracao: string;
                emergenciaMinutosTotais: number;
                justificativa: string;
                extraManualDiurna: number;
                extraManualNoturna: number;
                temAtraso: boolean;
                descontoDiurno: number;
                descontoNoturno: number;
            }
        } = {};

        pontos.forEach(p => {
            if (!p.data_registro) return;
            const dLocal = new Date(new Date(p.data_registro).toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
            const chave = `${p.funcionario_id}-${dLocal.getFullYear()}-${dLocal.getMonth() + 1}-${dLocal.getDate()}`;

            if (!mapa[chave]) mapa[chave] = { pontos: [], minutosPausa: 0, textoAjuste: '', emergenciaSaida: '---', emergenciaRetorno: '---', emergenciaDuracao: '---', emergenciaMinutosTotais: 0, justificativa: '', extraManualDiurna: 0, extraManualNoturna: 0, temAtraso: false, descontoDiurno: 0, descontoNoturno: 0 };
            mapa[chave].pontos.push(p);

            if (p.observacao === 'Atraso') {
                mapa[chave].temAtraso = true;
            }
        });

        pausas.forEach(p => {
            if (!p.data) return;
            const dLocal = new Date(new Date(p.data).toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
            const chave = `${p.funcionario_id}-${dLocal.getFullYear()}-${dLocal.getMonth() + 1}-${dLocal.getDate()}`;

            if (!mapa[chave]) mapa[chave] = { pontos: [], minutosPausa: 0, textoAjuste: '', emergenciaSaida: '---', emergenciaRetorno: '---', emergenciaDuracao: '---', emergenciaMinutosTotais: 0, justificativa: '', extraManualDiurna: 0, extraManualNoturna: 0, temAtraso: false, descontoDiurno: 0, descontoNoturno: 0 };

            if (p.tipo === 'pausa') {
                mapa[chave].minutosPausa += Number(p.minutos_ajuste || 0);
            } else if (p.tipo === 'feriado' || p.tipo === 'folga' || p.tipo === 'justificativa') {
                const textoObserbacao = String(p.observacao || '').toUpperCase();
                if (mapa[chave].textoAjuste.startsWith("ATESTADO:")) return;

                if (p.tipo === 'justificativa' || textoObserbacao.startsWith("ATESTADO:")) {
                    mapa[chave].textoAjuste = textoObserbacao;
                } else {
                    mapa[chave].textoAjuste = textoObserbacao;
                }
            }
        });

        bancoHoras.forEach(b => {
            if (!b.data_evento) return;
            const [ano, mes, dia] = b.data_evento.split('-').map(Number);
            const chave = `${b.funcionario_id}-${ano}-${mes}-${dia}`;

            if (!mapa[chave]) mapa[chave] = { pontos: [], minutosPausa: 0, textoAjuste: '', emergenciaSaida: '---', emergenciaRetorno: '---', emergenciaDuracao: '---', emergenciaMinutosTotais: 0, justificativa: '', extraManualDiurna: 0, extraManualNoturna: 0, temAtraso: false, descontoDiurno: 0, descontoNoturno: 0 };

            if (!mapa[chave].textoAjuste.startsWith("ATESTADO:")) {
                mapa[chave].textoAjuste = String(b.motivo || '').toUpperCase();
            }

            if (b.tipo_hora === 'DIURNA') {
                mapa[chave].descontoDiurno += Math.abs(b.minutos_ajuste);
            } else if (b.tipo_hora === 'NOTURNA') {
                mapa[chave].descontoNoturno += Math.abs(b.minutos_ajuste);
            }
        });

        saidasEmergencia.forEach(s => {
            if (!s.horario_saida) return;
            const dLocal = new Date(new Date(s.horario_saida).toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
            const chave = `${s.funcionario_id}-${dLocal.getFullYear()}-${dLocal.getMonth() + 1}-${dLocal.getDate()}`;

            if (!mapa[chave]) mapa[chave] = { pontos: [], minutosPausa: 0, textoAjuste: '', emergenciaSaida: '---', emergenciaRetorno: '---', emergenciaDuracao: '---', emergenciaMinutosTotais: 0, justificativa: '', extraManualDiurna: 0, extraManualNoturna: 0, temAtraso: false, descontoDiurno: 0, descontoNoturno: 0 };

            const formataHora = (isoString: string | null) => {
                if (!isoString) return 'Ab.';
                return new Date(isoString).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });
            };

            const minutesPuros = s.horario_retorno ? Math.floor((new Date(s.horario_retorno).getTime() - new Date(s.horario_saida).getTime()) / 60000) : 0;
            const hSaida = formataHora(s.horario_saida);
            const hRetorno = formataHora(s.horario_retorno);
            const hDuracao = minutesPuros > 0 ? `${minutesPuros}m` : 'Ab.';

            mapa[chave].emergenciaMinutosTotais += minutesPuros;
            mapa[chave].emergenciaSaida = mapa[chave].emergenciaSaida === '---' ? hSaida : `${mapa[chave].emergenciaSaida}|${hSaida}`;
            mapa[chave].emergenciaRetorno = mapa[chave].emergenciaRetorno === '---' ? hRetorno : `${mapa[chave].emergenciaRetorno}|${hRetorno}`;
            mapa[chave].emergenciaDuracao = mapa[chave].emergenciaDuracao === '---' ? hDuracao : `${mapa[chave].emergenciaDuracao}|${hDuracao}`;
            mapa[chave].justificativa = mapa[chave].justificativa === '' ? s.justificativa : `${mapa[chave].justificativa}; ${s.justificativa}`;
        });

        extrasManuais.forEach(m => {
            if (!m.data_referencia) return;
            const [ano, mes, dia] = m.data_referencia.split('-').map(Number);
            const chave = `${m.funcionario_id}-${ano}-${mes}-${dia}`;

            if (!mapa[chave]) mapa[chave] = { pontos: [], minutosPausa: 0, textoAjuste: '', emergenciaSaida: '---', emergenciaRetorno: '---', emergenciaDuracao: '---', emergenciaMinutosTotais: 0, justificativa: '', extraManualDiurna: 0, extraManualNoturna: 0, temAtraso: false, descontoDiurno: 0, descontoNoturno: 0 };
            mapa[chave].extraManualDiurna += Number(m.minutos_diurnos || 0);
            mapa[chave].extraManualNoturna += Number(m.minutos_noturnos || 0);
        });

        Object.keys(mapa).forEach(chave => {
            mapa[chave].pontos.sort((a, b) => a.hora_formatada.localeCompare(b.hora_formatada));
        });

        return mapa;
    }, [pontos, pausas, saidasEmergencia, extrasManuais, bancoHoras]);

    const obterDadosComExtrasDoDia = (funcionarioId: string, itemDia: DiaCompetencia) => {
        const chave = `${funcionarioId}-${itemDia.ano}-${itemDia.mes}-${itemDia.dia}`;
        const dadosDoDia = mapaDadosAgrupados[chave];

        const retornoBase = {
            entrada: '---', saidaAlmoço: '---', voltaAlmoço: '---', saidaFinal: '---',
            totalPausa: '---', emSaida: '---', emRetorno: '---', emDuracao: '---',
            justificativa: '', extraDiurnaMinutos: 0, extraNoturnaMinutos: 0, minutosEmergenciaAcumuladoDia: 0, minutosPausaPurosDia: 0, temAtraso: false,
            textoAjuste: '', descontoDiurno: 0, descontoNoturno: 0
        };

        if (!dadosDoDia) return retornoBase;

        const pts = dadosDoDia.pontos;
        let extraDiurnaCalculada = 0;
        let extraNoturnaCalculada = 0;

        if (pts.length >= 4) {
            const converteParaMinutos = (hhmm: string) => {
                const [h, m] = hhmm.split(':').map(Number);
                return h * 60 + m;
            };

            const entrada = converteParaMinutos(pts[0].hora_formatada);
            const saidaAlm = converteParaMinutos(pts[1].hora_formatada);
            const voltaAlm = converteParaMinutos(pts[2].hora_formatada);
            const saidaFim = converteParaMinutos(pts[3].hora_formatada);

            const totalTrabalhado = (saidaAlm - entrada) + (saidaFim - voltaAlm);
            const jornadaPadrao = 8 * 60;

            if (totalTrabalhado > jornadaPadrao) {
                let extrasRestantes = totalTrabalhado - jornadaPadrao;
                const limiteNoite = 18 * 60;

                if (saidaFim > limiteNoite) {
                    extraNoturnaCalculada = Math.min(saidaFim - limiteNoite, extrasRestantes);
                    extrasRestantes -= extraNoturnaCalculada;
                }
                extraDiurnaCalculada = extrasRestantes;
            }
        }

        return {
            entrada: pts[0] ? pts[0].hora_formatada : '---',
            saidaAlmoço: pts[1] ? pts[1].hora_formatada : '---',
            voltaAlmoço: pts[2] ? pts[2].hora_formatada : '---',
            saidaFinal: pts[3] ? pts[3].hora_formatada : '---',
            totalPausa: dadosDoDia.minutosPausa > 0 ? `${dadosDoDia.minutosPausa} min` : '---',
            emSaida: dadosDoDia.emergenciaSaida,
            emRetorno: dadosDoDia.emergenciaRetorno,
            emDuracao: dadosDoDia.emergenciaDuracao,
            justificativa: dadosDoDia.justificativa,
            extraDiurnaMinutos: extraDiurnaCalculada + dadosDoDia.extraManualDiurna,
            extraNoturnaMinutos: extraNoturnaCalculada + dadosDoDia.extraManualNoturna,
            minutosEmergenciaAcumuladoDia: dadosDoDia.emergenciaMinutosTotais,
            minutosPausaPurosDia: dadosDoDia.minutosPausa,
            temAtraso: dadosDoDia.temAtraso,
            textoAjuste: dadosDoDia.textoAjuste,
            descontoDiurno: dadosDoDia.descontoDiurno,
            descontoNoturno: dadosDoDia.descontoNoturno
        };
    };

    const totaisGeraisCiclo = useMemo(() => {
        let acDiurna = 0; let acNoturna = 0; let acEmergencia = 0; let acPausas = 0;
        if (!colaboradorId) return { diurna: 0, noturna: 0, pausas: 0, emergencia: 0 };

        diasDoCiclo.forEach(d => {
            const j = obterDadosComExtrasDoDia(colaboradorId, d);
            acDiurna += (j.extraDiurnaMinutos - j.descontoDiurno);
            acNoturna += (j.extraNoturnaMinutos - j.descontoNoturno);
            acPausas += j.minutosPausaPurosDia;
            acEmergencia += j.minutosEmergenciaAcumuladoDia;
        });
        return { diurna: acDiurna, noturna: acNoturna, pausas: acPausas, emergencia: acEmergencia };
    }, [diasDoCiclo, mapaDadosAgrupados, colaboradorId]);

    const formatarMinutosTotais = (minutos: number) => {
        const isNegativo = minutos < 0;
        const minutosAbsolutos = Math.abs(minutos);
        const hrs = Math.floor(minutosAbsolutos / 60);
        const mnts = minutosAbsolutos % 60;
        return `${isNegativo ? '-' : ''}${hrs}h ${mnts.toString().padStart(2, '0')}m`;
    };

    const handleDesconectar = () => {
        localStorage.clear();
        router.push('/');
    };

    return (
        <main className="min-h-screen bg-black text-white p-4 font-sans print:bg-white print:text-black print:p-0 w-full">
            <header className="max-w-[1400px] mx-auto mb-6 bg-slate-900/40 p-5 rounded-[25px] border border-white/5 print:hidden flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="bg-orange-500/10 p-2.5 rounded-xl border border-orange-500/20 select-none">⏱️</div>
                    <div>
                        <h1 className="text-lg font-black uppercase italic leading-none">Meu Espelho de <span className="text-orange-500">Ponto</span></h1>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Consulta e Impressão de Cartão</p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Link href="/user" className="bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all text-center">Menu Principal</Link>
                    <select value={mesSelecionado} onChange={e => setMesSelecionado(Number(e.target.value))} className="bg-black border border-white/10 px-3 py-2 rounded-xl font-bold text-white text-xs outline-none cursor-pointer">
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (<option key={m} value={m}>Ciclo até 15/{String(m).padStart(2, '0')}</option>))}
                    </select>
                    <button onClick={() => window.print()} className="bg-orange-600 hover:bg-orange-500 px-4 py-2 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all">🖨️ Imprimir</button>
                    <button onClick={handleDesconectar} className="bg-red-950/40 border border-red-500/20 hover:bg-red-900/40 px-3 py-2 rounded-xl text-[10px] font-black text-red-400 uppercase transition-all">Sair</button>
                </div>
            </header>

            <section className="max-w-[1400px] print:max-w-[820px] mx-auto w-full">
                {carregando ? (
                    <div className="text-center py-32 animate-pulse font-black text-slate-700 tracking-[4px] uppercase select-none">Buscando folha de batidas no servidor...</div>
                ) : (
                    <div className="bg-white text-black p-4 sm:p-6 print:p-4 border border-slate-200 rounded-[24px] shadow-md w-full">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b-2 border-black pb-3 mb-4 text-xs w-full">
                            <div className="space-y-1">
                                <h2 className="text-base font-black uppercase tracking-tight text-black leading-none">GR AUTOPECAS LTDA</h2>
                                <p className="text-[10px] font-bold text-slate-700 font-mono">CNPJ: 51.415.349/0001-25</p>
                                <p className="text-[9px] text-slate-500 leading-tight">Rua Coronel Vicente Ramos, Nº1552 — Arapiraca - AL</p>
                            </div>
                            <div className="text-left sm:text-right space-y-1">
                                <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider leading-none">Colaborador</p>
                                <h3 className="text-base font-black uppercase italic leading-none">{colaboradorNome}</h3>
                                <p className="text-[10px] font-bold text-orange-600 uppercase tracking-wide leading-none">{cargo} • ID: {colaboradorId}</p>
                                <p className="text-xs font-black uppercase tracking-wider text-slate-800 mt-1">Período: 16/{String(mesSelecionado === 1 ? 12 : mesSelecionado - 1).padStart(2, '0')} a 15/{String(mesSelecionado).padStart(2, '0')}/{anoSelecionado}</p>
                            </div>
                        </div>

                        <div className="w-full overflow-x-auto print:overflow-visible">
                            <table className="w-full text-left text-xs border-collapse table-auto print:table-fixed min-w-[1050px] print:min-w-0">
                                <thead>
                                <tr className="border-b border-slate-300 text-slate-800 uppercase font-black text-[10px] print:text-[7.5px] tracking-wider bg-slate-100">
                                    <th className="py-2 px-2 w-[85px] print:w-[58px]">Data</th>
                                    <th className="py-2 px-2 text-center w-[60px] print:w-[38px]">Entrada</th>
                                    <th className="py-2 px-2 text-center w-[60px] print:w-[38px]">Sai Alm</th>
                                    <th className="py-2 px-2 text-center w-[60px] print:w-[38px]">Vol Alm</th>
                                    <th className="py-2 px-2 text-center w-[60px] print:w-[38px]">Sai Fim</th>
                                    <th className="py-2 px-2 text-center w-[65px] print:w-[42px] text-red-600 bg-red-500/5 font-black border-l border-slate-200">S. Emerg</th>
                                    <th className="py-2 px-2 text-center w-[65px] print:w-[42px] text-red-600 bg-red-500/5 font-black">V. Emerg</th>
                                    <th className="py-2 px-2 text-center w-[60px] print:w-[38px] text-red-700 bg-red-500/10 font-black border-r border-slate-200">Tempo</th>
                                    <th className="py-2 px-3 text-left w-[220px] print:w-[120px] text-red-700 bg-red-500/5 font-black">Motivo Emergência</th>
                                    <th className="py-2 px-2 text-center w-[70px] print:w-[42px] text-orange-600 border-l border-slate-200">Tot Pausa</th>
                                    <th className="py-2 px-2 text-right min-w-[150px] border-l border-dashed border-slate-300">Assinatura / Ajustes</th>
                                </tr>
                                </thead>
                                <tbody>
                                {diasDoCiclo.map((itemDia, idx) => {
                                    const j = obterDadosComExtrasDoDia(colaboradorId || '', itemDia);
                                    const possuiExcecaoAmarela = !!j.textoAjuste;

                                    return (
                                        <tr key={idx} className={`border-b border-slate-100 text-xs print:text-[9px] print:[color-adjust:exact] [color-adjust:exact] ${j.temAtraso ? 'bg-red-50/70 border-l-4 border-l-red-500 font-medium' : possuiExcecaoAmarela ? 'bg-yellow-50 font-semibold' : itemDia.isFimDeSemana ? 'bg-slate-100/70 font-medium' : 'hover:bg-slate-50'}`}>
                                            <td className={`py-2 px-2 font-mono font-black ${j.temAtraso ? 'text-red-700' : possuiExcecaoAmarela ? 'text-amber-800' : itemDia.isDomingo ? 'text-blue-700' : itemDia.isFimDeSemana ? 'text-emerald-600' : 'text-black'}`}>
                                                {itemDia.label} <span className="font-sans font-bold text-[10px] print:text-[8px] opacity-75">[{itemDia.diaSemanaLabel}]</span>
                                            </td>
                                            <td className="py-2 px-2 font-mono text-center text-slate-700">{j.entrada}</td>
                                            <td className="py-2 px-2 font-mono text-center text-slate-600">{j.saidaAlmoço}</td>
                                            <td className="py-2 px-2 font-mono text-center text-slate-600">{j.voltaAlmoço}</td>
                                            <td className="py-2 px-2 font-mono text-center text-slate-700">{j.saidaFinal}</td>
                                            <td className="py-2 px-2 font-mono text-center font-black text-red-600 bg-red-500/[0.03] border-l border-slate-100">{j.emSaida}</td>
                                            <td className="py-2 px-2 font-mono text-center font-black text-red-600 bg-red-500/[0.03]">{j.emRetorno}</td>
                                            <td className="py-2 px-2 font-mono text-center font-black text-red-700 bg-red-500/[0.07] border-r border-slate-100">{j.emDuracao}</td>
                                            <td className="py-2 px-3 text-left text-xs print:text-[7px] font-black text-red-700 bg-red-500/[0.03] italic whitespace-normal break-words max-w-[180px]">{j.justificativa || '---'}</td>
                                            <td className="py-2 px-2 font-mono text-center font-black text-orange-600 bg-orange-500/[0.02] border-l border-slate-100">{j.totalPausa}</td>
                                            <td className={`py-2 px-2 border-l border-dashed border-slate-200 text-center font-mono font-black text-[8px] uppercase tracking-tight whitespace-nowrap ${j.textoAjuste.startsWith("ATESTADO:") ? 'text-red-600 font-extrabold' : possuiExcecaoAmarela ? 'text-amber-700 font-black' : 'text-[#007aff]'}`}>
                                                {j.textoAjuste || ''}
                                            </td>
                                        </tr>
                                    );
                                })}
                                </tbody>
                            </table>
                        </div>

                        {/* PLACAR RESUMIDO */}
                        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                            <div className="text-center lg:border-r border-slate-200/80 pb-2 lg:pb-0 flex flex-col items-center justify-center">
                                <div className="flex items-center gap-1">
                                    <span>☀️</span>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider leading-none">Total Extra Diurna (Líquido)</p>
                                </div>
                                <p className="text-sm font-mono font-black text-emerald-600 mt-1.5">{formatarMinutosTotais(totaisGeraisCiclo.diurna)}</p>
                            </div>
                            <div className="text-center lg:border-r border-slate-200/80 pb-2 lg:pb-0 flex flex-col items-center justify-center">
                                <div className="flex items-center gap-1">
                                    <span>🌙</span>
                                    <p className="text-[10px] font-black text-blue-800 uppercase tracking-wider leading-none">Total Extra Noturna (Líquido)</p>
                                </div>
                                <p className="text-sm font-mono font-black text-blue-700 mt-1.5">{formatarMinutosTotais(totaisGeraisCiclo.noturna)}</p>
                            </div>
                            <div className="text-center lg:border-r border-slate-200/80 pb-2 lg:pb-0 pt-2 lg:pt-0 flex flex-col items-center justify-center">
                                <div className="flex items-center gap-1">
                                    <span>☕</span>
                                    <p className="text-[10px] font-black text-orange-600 uppercase tracking-wider leading-none">Total de Pausas</p>
                                </div>
                                <p className="text-sm font-mono font-black text-orange-400 mt-1.5">{formatarMinutosTotais(totaisGeraisCiclo.pausas)}</p>
                            </div>
                            <div className="text-center pt-2 lg:pt-0 flex flex-col items-center justify-center">
                                <div className="flex items-center gap-1">
                                    <span>🚨</span>
                                    <p className="text-[10px] font-black text-red-600 uppercase tracking-wider leading-none">Total Tempo Fora</p>
                                </div>
                                <p className="text-sm font-mono font-black text-red-600 mt-1.5">{formatarMinutosTotais(totaisGeraisCiclo.emergencia)}</p>
                            </div>
                        </div>

                        {/* DECLARAÇÃO */}
                        <div className="mt-8 px-1">
                            <p className="text-[11px] text-slate-900 font-bold leading-relaxed tracking-wide text-justify whitespace-normal break-words max-w-3xl">
                                Declaro, para os devidos fins de fechamento e apuração contábil, estar plenamente ciente das marcações de ponto, intervalos mecânicos e registros de saídas extras descritos nesta folha. Confirmo que todas as ausências, faltas hives e/ou atrasos ocorridos ao longo deste ciclo de competência foram devidamente justificados perante a gerência, expressando minha total concordância com os saldos apurados e registros armazenados.
                            </p>
                        </div>

                        {/* ASSINATURAS */}
                        <div className="mt-12 flex flex-col sm:flex-row justify-between items-center gap-8 sm:gap-12 pt-4 border-t border-slate-300">
                            <div className="w-full sm:w-64 text-center">
                                <div className="border-b border-black w-full h-5 mb-2"></div>
                                <p className="text-[10px] font-black uppercase tracking-wider text-black">Responsável GR Autopeças</p>
                            </div>
                            <div className="w-full sm:w-64 text-center">
                                <div className="border-b border-black w-full h-5 mb-2"></div>
                                <p className="text-[10px] font-black uppercase tracking-wider text-black">Assinatura do Colaborador</p>
                            </div>
                        </div>
                    </div>
                )}
            </section>

            <style jsx global>{`
                @media print {
                    html, body { background: white !important; color: black !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                    main { background: white !important; padding: 0 !important; }
                    header { display: none !important; }
                    @page { size: A4 portrait; margin: 8mm 6mm 8mm 6mm; }
                    th, td, div, tr { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                }
            `}</style>
        </main>
    );
}

export default function EspelhoPontoPage() { return <Suspense fallback={null}><EspelhoPontoConteudo /></Suspense>; }