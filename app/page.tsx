"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

export default function PortalLoginPage() {
  const router = useRouter();
  const [funcionarioId, setFuncionarioId] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!funcionarioId.trim() || !senha.trim()) {
      setErro("Preencha o ID do crachá e a senha de acesso.");
      return;
    }

    setCarregando(true);
    setErro(null);

    try {
      // Busca o usuário na tabela dedicada de acessos do trabalhador
      const { data, error } = await supabase
          .from('usuarios_ponto')
          .select('funcionario_id, nome, senha')
          .eq('funcionario_id', funcionarioId.trim().toUpperCase())
          .single();

      if (error || !data) {
        throw new Error("ID de crachá não localizado no sistema de pátio.");
      }

      // Validação direta da senha cadastrada pelo RH
      if (data.senha !== senha.trim()) {
        throw new Error("Senha de consulta incorreta. Tente novamente.");
      }

      // Salva as credenciais básicas localmente para auditoria das rotas filhas
      localStorage.setItem('gr_colaborador_id', data.funcionario_id);
      localStorage.setItem('gr_colaborador_nome', data.nome);

      // Redireciona direto para o espelho de ponto individual
      router.push('/user/ponto');

    } catch (err: any) {
      console.error(err);
      setErro(err.message || "Falha ao validar credenciais no servidor.");
    } finally {
      setCarregando(false);
    }
  };

  return (
      <main className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f] font-sans antialiased flex flex-col justify-between p-4 selection:bg-orange-500/10">

        {/* Espaçador superior para centralizar o bloco */}
        <div className="flex-1 flex items-center justify-center w-full max-w-sm mx-auto">
          <div className="w-full bg-white border border-[#e5e5ea] rounded-3xl p-6 sm:p-8 shadow-[0_4px_12px_rgba(0,0,0,0.02)] space-y-6">

            {/* CABEÇALHO BRANDING */}
            <div className="text-center space-y-1.5 select-none">
                        <span className="inline-block text-[8px] font-black uppercase tracking-[3px] text-orange-600 bg-orange-50 px-2 py-0.5 rounded">
                            Portal do Colaborador
                        </span>
              <h1 className="text-xl font-bold tracking-tight text-[#1d1d1f]">
                GR Autopeças
              </h1>
              <p className="text-[10px] font-medium text-[#86868b] uppercase tracking-wider">
                Consulta de Espelho de Ponto &amp; Avisos
              </p>
            </div>

            {/* FEEDBACK DE ERRO */}
            {erro && (
                <div className="bg-red-50 border border-red-200 p-3 rounded-xl text-center text-[11px] font-bold text-red-600">
                  ⚠️ {erro}
                </div>
            )}

            {/* FORMULÁRIO */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[9px] font-bold uppercase tracking-wider text-[#86868b] ml-0.5">
                  ID do Crachá Patrimonial
                </label>
                <input
                    type="text"
                    placeholder="EX: 1024"
                    value={funcionarioId}
                    onChange={e => setFuncionarioId(e.target.value)}
                    className="w-full bg-[#f5f5f7] border border-[#e5e5ea] focus:border-[#b4b4b9] px-4 py-2.5 rounded-xl outline-none text-[#ff9500] text-center font-mono font-black text-sm uppercase placeholder-[#b4b4b9] transition-colors"
                    required
                    disabled={carregando}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[9px] font-bold uppercase tracking-wider text-[#86868b] ml-0.5">
                  Senha de Consulta
                </label>
                <input
                    type="password"
                    placeholder="Digite sua senha..."
                    value={senha}
                    onChange={e => setSenha(e.target.value)}
                    className="w-full bg-[#f5f5f7] border border-[#e5e5ea] focus:border-[#b4b4b9] px-4 py-2.5 rounded-xl outline-none text-[#1d1d1f] text-center font-mono font-bold text-xs placeholder-[#b4b4b9] transition-colors"
                    required
                    disabled={carregando}
                />
              </div>

              <button
                  type="submit"
                  disabled={carregando}
                  className="w-full bg-[#1d1d1f] hover:bg-black text-white py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-40 shadow-sm"
              >
                {carregando ? "Autenticando..." : "Entrar no Portal"}
              </button>
            </form>
          </div>
        </div>

        {/* RODAPÉ INTEGRADO */}
        <footer className="w-full text-center text-[8px] font-bold uppercase tracking-wider text-[#b4b4b9] select-none py-4 border-t border-[#e5e5ea]/60 max-w-sm mx-auto">
          GR Autopeças &amp; Serviços • v3.0
        </footer>
      </main>
  );
}