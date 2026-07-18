import React, { useState } from 'react';
import styles from './modules/LoginAV.module.css';
import LeftAV from './LeftAV';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function LoginAV() {
  const [view, setView] = useState('cadastro');
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [dia, setDia] = useState('');
  const [mes, setMes] = useState('');
  const [ano, setAno] = useState('');

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  const passwordMismatch = confirm.length > 0 && password !== confirm;
  const nameTooLong = name.length > 16;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const emailInvalid = email?.length > 0 && !emailRegex.test(email);
  const camposVazios = !name || !email || !dia || !mes || !ano || !password || !confirm;
  const camposVaziosLogin = !loginEmail || !loginPassword;

  async function handleCadastro() {
    if (camposVazios || loading) return;
    setLoading(true);
    try {
      const hoje = new Date();
      const nascimento = new Date(ano, mes - 1, dia);
      let idade = hoje.getFullYear() - nascimento.getFullYear();

      const aindaNaoFezAniversario =
        hoje.getMonth() < nascimento.getMonth() ||
        (hoje.getMonth() === nascimento.getMonth() && hoje.getDate() < nascimento.getDate());

      if (aindaNaoFezAniversario) idade--;

      const { data } = await axios.post('http://localhost:8081/apiAv/Register', {
        username: name,
        email,
        idade,
        senha: password,
      });

      const { senha: _/*ignored*/, ...another } = data;
      const anotherStr = JSON.stringify(another);
      localStorage.setItem("user", anotherStr);
      window.dispatchEvent(new StorageEvent("storage", { key: "user", newValue: anotherStr }));
      navigate('/home');
    } catch (error) {
      setErro(error.response?.data?.message || 'Erro, resolveremos isso logo');
      console.log('ERRO COMPLETO:', error);
  console.log('RESPOSTA:', error.response);
  setErro(error.response?.data?.message || 'Erro, resolveremos isso logo');
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin() {
    if (camposVaziosLogin || loading) return;
    setLoading(true);
    try {
      const { data } = await axios.post('http://localhost:8081/apiAv/Login', {
        email: loginEmail,
        senha: loginPassword,
      });

      const { senha: _/*ignora tudo*/, ...another } = data;
      const anotherStr = JSON.stringify(another);
      localStorage.setItem("user", anotherStr);
      window.dispatchEvent(new StorageEvent("storage", { key: "user", newValue: anotherStr }));
      navigate('/home');
    } catch (error) {
      console.log(error);
      setErro('Email ou senha incorretos');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.flex_div}>
      <div className={styles.left}>
        <LeftAV />
      </div>

      <div className={styles.right_general}>
        <h1 className={styles.brandTitle}>AretiVitae</h1>

        <div className={styles.container}>
          {view === 'cadastro' ? (
            <>
              <div className={styles.titleRow}>
                <h1 className={styles.title}>Cadastro</h1>
              </div>

              <div className={styles.inputWrapper}>
                <input
                  type="text"
                  placeholder="Nome"
                  className={`${styles.input} ${nameTooLong ? styles.inputError : ''}`}
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
                {nameTooLong && (
                  <span className={styles.errorMsg}>Nome deve ter ({name.length}/16)</span>
                )}
              </div>

              <div className={styles.inputWrapper}>
                <input
                  type="email"
                  placeholder="Email"
                  className={`${styles.input} ${emailInvalid ? styles.inputError : ''}`}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
                {emailInvalid && (
                  <span className={styles.errorMsg}>Email inválido — ex: nome@dominio.com</span>
                )}
              </div>

              <div className={styles.selectRow}>
                <select className={styles.select} value={dia} onChange={e => setDia(e.target.value)}>
                  <option value="">Dia</option>
                  {Array.from({ length: 31 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>{i + 1}</option>
                  ))}
                </select>

                <select className={styles.select} value={mes} onChange={e => setMes(e.target.value)}>
                  <option value="">Mês</option>
                  {['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'].map((m, i) => (
                    <option key={i} value={i + 1}>{m}</option>
                  ))}
                </select>

                <select className={styles.select} value={ano} onChange={e => setAno(e.target.value)}>
                  <option value="">Ano</option>
                  {Array.from({ length: 100 }, (_, i) => {
                    const year = new Date().getFullYear() - i;
                    return <option key={year} value={year}>{year}</option>;
                  })}
                </select>
              </div>

              <input
                type="password"
                placeholder="Senha"
                className={styles.input}
                value={password}
                onChange={e => setPassword(e.target.value)}
              />

              <div className={styles.inputWrapper}>
                <input
                  type="password"
                  placeholder="Confirmar senha"
                  className={`${styles.input} ${passwordMismatch ? styles.inputError : ''}`}
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                />
                {passwordMismatch && (
                  <span className={styles.errorMsg}>As senhas não coincidem</span>
                )}
              </div>

              {erro && <span className={styles.errorMsg}>{erro}</span>}

              <button
                className={styles.button}
                disabled={passwordMismatch || nameTooLong || emailInvalid || camposVazios || loading}
                onClick={handleCadastro}
              >
                {loading ? 'Cadastrando...' : 'Imergir'}
              </button>

              <p className={styles.switchText}>
                Já tem conta?{' '}
                <span onClick={() => setView('login')} style={{ cursor: 'pointer' }}>
                  Entrar
                </span>
              </p>
            </>
          ) : (
            <>
              <div className={styles.titleRow}>
                <h1 className={styles.title}>Entrar</h1>
              </div>

              <input
                type="email"
                placeholder="Email"
                className={styles.input}
                value={loginEmail}
                onChange={e => setLoginEmail(e.target.value)}
              />

              <input
                type="password"
                placeholder="Senha"
                className={styles.input}
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
              />

              {erro && <span className={styles.errorMsg}>{erro}</span>}

              <button
                className={styles.button}
                onClick={handleLogin}
                disabled={camposVaziosLogin || loading}
              >
                {loading ? 'Entrando...' : 'Imergir'}
              </button>

              <p className={styles.switchText}>
                Não tem conta?{' '}
                <span onClick={() => setView('cadastro')} style={{ cursor: 'pointer' }}>
                  Cadastrar
                </span>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}