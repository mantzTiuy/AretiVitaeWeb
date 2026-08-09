import { useEffect, useState } from "react";
import styles from "./modules/account.module.css";
import TopDisplay from './Topdisplay';
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Cerberus from "./Cerberus";
import ConfirmModal from "./ConfirmModal";

const API_BASE = "http://localhost:8081";

function Titlebar({ label }) {
  return (
    <div className={styles.titlebar}>
      <span className={styles.titlebarLabel}>{label}</span>
      <div className={styles.dots}>
        <div className={`${styles.dot} ${styles.dotGray}`} />
        <div className={`${styles.dot} ${styles.dotYellow}`} />
        <div className={`${styles.dot} ${styles.dotRed}`} />
      </div>
    </div>
  );
}

function SectionTitle({ label }) {
  return (
    <div className={styles.sectionTitle}>
      <span className={styles.sectionLine} />
      <p>{label}</p>
      <span className={styles.sectionLine} />
    </div>
  );
}

function formatarData(isoDate) {
  if (!isoDate) return '-';
  const [ano, mes, dia] = isoDate.split('-');
  return `${dia}/${mes}/${ano}`;
}

export default function Account() {
  const navigate = useNavigate();

  const [openLogout, setOpenLogout] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  //Objeto do user
  function getUser() {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  }

  const userObj = getUser();

  //Padrão do form
  const [form, setForm] = useState({
    name:            userObj?.username ?? '',
    email:           userObj?.email ?? '',
    currentPassword: '',
    newPassword:     '',
    confirmPassword: '',
  });

  const [assinatura, setAssinatura] = useState({
    nomePlano: '...',
    dayVencimento: null,
    ativo: false,
  });

  //Status da assinatura
  useEffect(() => {
    const id = getUser()?.id;
    if (!id) return;

    axios.get(`${API_BASE}/ApiAvCompra/status/${id}`)
      .then(({ data }) => {
        if (data.temAcesso) {
          setAssinatura({
            nomePlano: data.nomePlano,
            dayVencimento: data.dayVencimento,
            ativo: true,
          });
        } else {
          setAssinatura({
            nomePlano: 'Básico',
            dayVencimento: null,
            ativo: false,
          });
        }
      })
      .catch((erro) => console.error("Erro ao buscar status da assinatura:", erro));
  }, []);


  //Registra o objeto user do usuário no localStorage para acessar em outra sessão nas próximas telas, como na home
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === "user") {
        const parsed = e.newValue ? JSON.parse(e.newValue) : null;
        setForm(prev => ({
          ...prev,
          name: parsed?.username ?? '',
          email: parsed?.email ?? '',
        }));
      }
    };
    window.addEventListener("storage", handleStorage);//Só dispara em telas diferentes da tela em que está instaurado, que no caso é account
    return () => window.removeEventListener("storage", handleStorage);
  }, []);



  //Função que retorna outra função, chama função curried de acordo com a IA.
  const handleChange = (field) => (e) => {
    setErro('');
    setSucesso(false);
    setForm((prev) => ({ ...prev, [field]: e.target.value }));//A chamada da função é interna dela mesma, (bizerro :/)
  };

  //Logout
  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  const emptyPassword    = passwordTouched && form.currentPassword.trim() === '';
  const passwordMismatch = form.confirmPassword.length > 0 && form.newPassword !== form.confirmPassword;


  async function handleSave() {
    setPasswordTouched(true);//Pra não ficar disparando o input vermelho ao entrar direto
    if (form.currentPassword.trim() === '' || passwordMismatch || loading) return;

    setLoading(true);
    setErro('');
    setSucesso(false);

    try {
      const id = getUser()?.id;//? serve pra pra verificar se é null primeiro, assim ele dispara o erro ao invés de só aparecer um "null" no input

      const body = {
        username: form.name,
        email:    form.email,
        senha:    form.currentPassword,
      };

      if (form.newPassword.trim() !== '') {//Evitar que o trim tire tudo (se a senha for só espaço)
        body.senha = form.newPassword;
      }

      const { data } = await axios.put(`${API_BASE}/apiAv/Update/${id}`, body);//Body é o corpo da requisição

      const { senha: _, ...another } = data;//Não salva senha no localStorage por motivos obvios
      const anotherStr = JSON.stringify(another);
      localStorage.setItem("user", anotherStr);
      window.dispatchEvent(new StorageEvent("storage", { key: "user", newValue: anotherStr }));//Faz com que o handleStorage rode na aba atual

      setSucesso(true);
      setPasswordTouched(false);
      setForm(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));//Volta ao estado original (sem nada)
    } catch (error) {
      setErro(error.response?.data?.message /*Tirar caso não queria erros estranhos na tela*/|| 'Erro ao salvar alterações');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.root}>

      <div className={styles.display}>
        <TopDisplay /> {/*TopDisplay é o display na parte de cima que tem a ilustração e as estrelas */}
      </div>

      <div className={styles.bodyWrapper}>
        <div className={styles.body}>

          <div className={styles.avatarRow}>
            <div className={styles.avatarWrap}>
              <Cerberus size={88} />{/*Passa o size de forma direta, aqui é diretamente proporcional ao tamanho na tela mesmo*/}
            </div>
            <div className={styles.avatarMeta}>
              <h1>{form.name}</h1>
              <p>{form.email}</p>
            </div>
          </div>

          <div className={styles.grid}>

            {/* Informações passadas com as funções que já estão nesse arquivo */}
            <div className={styles.window}>
              <Titlebar label="Informações" />
              <div className={styles.formBody}>
                <SectionTitle label="Identificação" />
                <div className={styles.field}>
                  <label>Nome</label>
                  <input
                    type="text"
                    value={form.name}
                    placeholder="Seu nome"
                    readOnly
                  />
                </div>
                <div className={styles.field}>
                  <label>E-mail</label>
                  <input
                    type="email"
                    value={form.email}
                    placeholder="nomedoemail@email.com"
                    readOnly
                  />
                </div>
                <button className={styles.logoutBtn} onClick={() => setOpenLogout(true)}>
                  Logout
                </button>
              </div>
            </div>

            {/* SEGURANÇA e afins */}
            <div className={styles.window}>
              <Titlebar label="Segurança" />
              <div className={styles.formBody}>
                <SectionTitle label="Senha" />
                <div className={styles.field}>
                  <label>Senha atual</label>
                  <input
                    type="password"
                    value={form.currentPassword}
                    onChange={handleChange('currentPassword')}
                    onBlur={() => setPasswordTouched(true)}
                    placeholder="••••••••"
                    className={emptyPassword ? styles.inputError : ''}
                  />
                  {emptyPassword && <span className={styles.errorMsg}>Senha obrigatória para salvar</span>}
                </div>
                <div className={styles.field}>
                  <label>Nova senha</label>
                  <input
                    type="password"
                    value={form.newPassword}
                    onChange={handleChange('newPassword')}
                    placeholder="••••••••"
                  />
                </div>
                <div className={styles.field}>
                  <label>Confirmar nova senha</label>
                  <input
                    type="password"
                    value={form.confirmPassword}
                    onChange={handleChange('confirmPassword')}
                    placeholder="••••••••"
                    className={passwordMismatch ? styles.inputError : ''}
                  />
                  {passwordMismatch && (
                    <span className={styles.errorMsg}>As senhas não coincidem</span>
                  )}
                </div>
              </div>
            </div>

            {/* ASSINATURA */}
            <div className={`${styles.window} ${styles.windowFull}`}>
              <Titlebar label="Assinatura" />
              <div className={styles.formBody}>
                <SectionTitle label="Plano" />
                <div className={styles.subscriptionGrid}>
                  <div className={styles.field}>
                    <label>Plano atual</label>
                    <input type="text" value={assinatura.nomePlano} disabled />
                  </div>
                  <div className={styles.field}>
                    <label>Data de renovação do plano</label>
                    <input type="text" value={formatarData(assinatura.dayVencimento)} disabled />
                  </div>
                  <div className={styles.field}>
                    <label>Status</label>
                    <input type="text" value={assinatura.ativo ? 'Ativo' : 'Desativado'} disabled />
                  </div>
                </div>
              </div>
            </div>

          </div>

          {erro && <span className={styles.errorMsg}>{erro}</span>}

          <div className={styles.btnRow}>
            <button
              className={styles.save}
              onClick={handleSave}
              disabled={loading || passwordMismatch}
            >
              {loading ? 'Salvando...' : 'Salvar alterações'}
            </button>
            <button className={styles.discard} onClick={() => navigate('/home')}>
              Cancelar
            </button>
          </div>

        </div>
      </div>

      {/* POP-UP LOGOUT */}
      {openLogout && (
        <ConfirmModal
          title="Sair da conta"
          message="Você tem certeza que deseja sair?"
          confirmLabel="Sim"
          cancelLabel="Cancelar"
          onConfirm={handleLogout}
          onClose={() => setOpenLogout(false)}
        />
      )}

      {/* POP-UP SUCESSO NO UPDATE */}
      {sucesso && (
        <ConfirmModal
          title="Alterações salvas"
          message="Suas informações foram atualizadas com sucesso!"
          confirmLabel="Ok"
          cancelLabel="Fechar"
          onConfirm={() => setSucesso(false)}
          onClose={() => setSucesso(false)}
        />
      )}

    </div>
  );
}