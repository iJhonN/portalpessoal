"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';

export const dynamic = 'force-dynamic';

export default function ConfigurarSenhaPage() {
    const router = useRouter();
    const [colaboradorId, setColaboradorId] = useState<string | null>(null);
    const [colaboradorNome, setColaboradorNome] = useState<string>('Colaborador');

    const [senhaAtual, setSenhaAtual] = useState('');
    const [novaSenha, setNovaSenha] = useState('');
    const [confirmarSenha, setConfirmarSenha] = useState('');

    const [enviando, setEnviando] = useState(false);
    const [statusFeed, setStatusFeed] = useState({ tipo: '', texto: '' });

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

    const handleAlterarSenha = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!colaboradorId) return;

        setStatusFeed({ tipo: '', texto: '' });

        // Validações básicas de segurança na interface
        if (!senhaAtual || !novaSenha || !confirmarSenha) {
            setStatusFeed({ tipo: 'erro', texto: 'Preencha todos os campos para prosseguir.' });
            return;
        }

        if (novaSenha !== confirmarSenha) {
            setStatusFeed({ tipo: 'erro', texto: 'A nova senha e a confirmação não estão iguais.' });
            return;
        }

        if (novaSenha.length < 4) {
            setStatusFeed({ tipo: 'erro', texto: 'A nova senha deve ter no mínimo 4 caracteres.' });
            return;
        }

        setEnviando(true);

        try {
            // 1. Verifica se a senha atual digitada está correta no banco de dados
            const { data: usuario, error: errorBusca } = await supabase
                .from('usuarios_ponto')
                .select('senha')
                .eq('funcionario_id', colaboradorId)
                .single();

            if (errorBusca || !usuario) throw new Error('Erro ao validar credenciais no servidor.');

            if (usuario.senha !== senhaAtual) {
                setStatusFeed({ tipo: 'erro', texto: 'A senha atual digitada está incorreta.' });
                setEnviando(false);
                return;
            }

            // 2. Atualiza a senha na tabela usuarios_ponto
            const { error: errorUpdate } = await supabase
                .from('usuarios_ponto')
                .update({ senha: novaSenha })
                .eq('funcionario_id', colaboradorId);

            if (errorUpdate) throw errorUpdate;

            setStatusFeed({
                tipo: 'sucesso',
                texto: 'Sua senha de acesso foi alterada com sucesso!'
            });

            // Limpa os inputs após o sucesso
            setSenhaAtual('');
            setNovaSenha('');
            setConfirmarSenha('');

        } catch (err: any) {
            console.error(err);
            setStatusFeed({ tipo: 'erro', texto: err.message || 'Falha ao atualizar dados no banco.' });
        } finally {
            setEnviando(false);
        }
    };

    return (
        <main className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f] p-4 sm:p-6 md:p-10 font-sans antialiased flex flex-col justify-between w-full selection:bg-orange-500/10">
            <div className="w-full max-w-md mx-auto flex-1 flex flex-col justify-center gap-6">

                {/* CABEÇALHO */}
                <header className="space-y-1.5 pl-1 text-center sm:text-left">
                    <Link href="/user" className="text-[10px] font-bold uppercase tracking-wider text-[#86868b] hover:text-orange-600 transition-colors block">
                        ← Painel Central
                    </Link>
                    <h1 className="text-xl font-semibold tracking-tight text-[#1d1d1f]">
                        Configurações de Segurança
                    </h1>
                    <p className="text-[11px] text-[#86868b] font-medium uppercase tracking-wide">
                        Colaborador: {colaboradorNome}
                    </p>
                </header>

                {/* FEEDBACK STATUS */}
                {statusFeed.texto && (
                    <div className={`p-3 rounded-xl text-center text-[11px] font-bold border transition-all ${
                        statusFeed.tipo === 'sucesso' ? 'bg-[#34c759]/5 border-[#34c759]/20 text-[#248a3d]' : 'bg-[#ff3b30]/5 border-[#ff3b30]/20 text-[#ff3b30]'
                    }`}>
                        {statusFeed.texto}
                    </div>
                )}

                {/* FORMULÁRIO */}
                <div className="bg-white border border-[#e5e5ea] p-6 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.01)] space-y-4">
                    <div className="border-b border-[#f5f5f7] pb-3 select-none">
                        <span className="text-[9px] font-bold uppercase text-orange-600 tracking-wider">Credenciais</span>
                        <h3 className="text-xs font-bold text-[#1d1d1f] uppercase tracking-wider mt-0.5">Alterar Senha de Acesso</h3>
                    </div>

                    <form onSubmit={handleAlterarSenha} className="space-y-4">

                        {/* SENHA ATUAL */}
                        <div className="space-y-1">
                            <label className="text-[9px] font-bold uppercase text-[#86868b] tracking-wider ml-0.5">Senha Atual</label>
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={senhaAtual}
                                onChange={e => setSenhaAtual(e.target.value)}
                                className="w-full bg-[#f5f5f7] border border-[#e5e5ea] focus:border-[#b4b4b9] px-3 py-2.5 rounded-lg text-xs font-bold outline-none text-[#1d1d1f]"
                                required
                                disabled={enviando}
                            />
                        </div>

                        <hr className="border-[#f5f5f7] my-2" />

                        {/* NOVA SENHA */}
                        <div className="space-y-1">
                            <label className="text-[9px] font-bold uppercase text-[#86868b] tracking-wider ml-0.5">Nova Senha</label>
                            <input
                                type="password"
                                placeholder="MÍNIMO 4 DIGÍTOS"
                                value={novaSenha}
                                onChange={e => setNovaSenha(e.target.value)}
                                className="w-full bg-[#f5f5f7] border border-[#e5e5ea] focus:border-[#b4b4b9] px-3 py-2.5 rounded-lg text-xs font-bold outline-none text-[#1d1d1f]"
                                required
                                disabled={enviando}
                            />
                        </div>

                        {/* CONFIRMAR NOVA SENHA */}
                        <div className="space-y-1">
                            <label className="text-[9px] font-bold uppercase text-[#86868b] tracking-wider ml-0.5">Confirmar Nova Senha</label>
                            <input
                                type="password"
                                placeholder="REPETA A NOVA SENHA"
                                value={confirmarSenha}
                                onChange={e => setConfirmarSenha(e.target.value)}
                                className="w-full bg-[#f5f5f7] border border-[#e5e5ea] focus:border-[#b4b4b9] px-3 py-2.5 rounded-lg text-xs font-bold outline-none text-[#1d1d1f]"
                                required
                                disabled={enviando}
                            />
                        </div>

                        {/* BOTÃO DISPARAR */}
                        <button
                            type="submit"
                            disabled={enviando}
                            className="w-full bg-[#1d1d1f] hover:bg-black text-white py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-40 mt-2"
                        >
                            {enviando ? "Salvando Nova Senha..." : "Salvar Configuração"}
                        </button>
                    </form>
                </div>

            </div>

            {/* FOOTER */}
            <footer className="w-full max-w-md mx-auto border-t border-[#e5e5ea] pt-5 mt-8 text-[8px] text-[#86868b] uppercase font-bold tracking-wider text-center select-none">
                <div>GR Autopeças &amp; Serviços • Segurança da Conta v1.0</div>
            </footer>
        </main>
    );
}