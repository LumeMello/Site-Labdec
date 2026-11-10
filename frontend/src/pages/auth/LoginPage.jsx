import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/ui/Button';
import { Input } from '../../components/ui/Field';
import logo from '../../assets/logo.svg';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ username: '', senha: '' });
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  const enviar = async (e) => {
    e.preventDefault();
    setErro('');
    setCarregando(true);
    try {
      await login(form.username.trim(), form.senha);
      navigate(location.state?.from?.pathname || '/dashboard', { replace: true });
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 text-center text-white">
        <img src={logo} alt="" className="mx-auto h-14 w-14" />
        <h1 className="mt-4 text-2xl font-bold">LABDEC</h1>
        <p className="text-sm text-brand-100/80">Gestão de Materiais, Equipamentos e Projetos · UFCI-RJ</p>
      </div>
      <form onSubmit={enviar} className="space-y-4 rounded-2xl bg-white p-6 shadow-xl">
        <Input
          label="Usuário"
          placeholder="Ex.: JoaoSilva20241"
          autoComplete="username"
          autoFocus
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          required
        />
        <Input
          label="Senha"
          type="password"
          autoComplete="current-password"
          value={form.senha}
          onChange={(e) => setForm({ ...form, senha: e.target.value })}
          required
        />
        {erro && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</p>}
        <Button type="submit" className="w-full" tamanho="lg" carregando={carregando}>Entrar</Button>
        <p className="text-center text-xs text-slate-500">
          As credenciais são fornecidas pelo Responsável pelo Laboratório. Em caso de problemas de acesso, procure-o.
        </p>
      </form>
    </div>
  );
}
