import { useEffect, useState } from "react";
import styles from "./modules/account.module.css";
import TopDisplay from './Topdisplay';
import { useNavigate } from "react-router-dom";

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

export default function Account() {
  const navigate = useNavigate();

  const [openLogout, setOpenLogout] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  function getUsername() {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user).username : null;
  }

  function getEmail() {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user).email : null;
  }

  const [email, setEmail]       = useState(() => getEmail());
  const [username, setUsername] = useState(() => getUsername());

  const [form, setForm] = useState({
    name:            username ?? '',
    email:           email ?? '',
    password:        'password',
    newPassword:     '',
    confirmPassword: '',
  });

  const [modalPassword, setModalPassword] = useState('');

  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === "user") {
        const parsed = e.newValue ? JSON.parse(e.newValue) : null;
        setUsername(parsed?.username ?? null);
        setEmail(parsed?.email ?? null);
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const [membership, setMembership] = useState(1);
  const [open, setOpen]             = useState(false);

  const handleChange = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const emptyName        = form.name.trim() === '';
  const emptyEmail       = form.email.trim() === '';
  const emptyPassword    = form.password.trim() === '';
  const nameTooLong      = form.name.length > 16;
  const emailRegex       = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const emailInvalid     = !emptyEmail && !emailRegex.test(form.email);
  const passwordMismatch = form.confirmPassword.length > 0 && form.newPassword !== form.confirmPassword;

  return (
    <div className={styles.root}>

      <div className={styles.display}>
        <TopDisplay />
      </div>

      <div className={styles.bodyWrapper}>
        <div className={styles.body}>

          <div className={styles.avatarRow}>
            <div className={styles.avatarWrap}>
              <div className={styles.avatar}>AV</div>
            </div>
            <div className={styles.avatarMeta}>
              <h1>{form.name || 'ExampleName'}</h1>
              <p>{form.email || 'example@email.com'}</p>
            </div>
          </div>

          <div className={styles.grid}>

            {/* INFORMAÇÕES */}
            <div className={styles.window}>
              <Titlebar label="Informações" />
              <div className={styles.formBody}>
                <SectionTitle label="Identificação" />
                <div className={styles.field}>
                  <label>Nome</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={handleChange('name')}
                    placeholder="Seu nome"
                    className={nameTooLong || emptyName ? styles.inputError : ''}
                  />
                  {emptyName && <span className={styles.errorMsg}>Nome obrigatório</span>}
                  {!emptyName && nameTooLong && (
                    <span className={styles.errorMsg}>Máx 16 caracteres ({form.name.length}/16)</span>
                  )}
                </div>
                <div className={styles.field}>
                  <label>E-mail</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={handleChange('email')}
                    placeholder="seu@email.com"
                    className={emailInvalid || emptyEmail ? styles.inputError : ''}
                  />
                  {emptyEmail && <span className={styles.errorMsg}>Email obrigatório</span>}
                  {!emptyEmail && emailInvalid && (
                    <span className={styles.errorMsg}>Email inválido</span>
                  )}
                </div>
                <button className={styles.logoutBtn} onClick={() => setOpenLogout(true)}>
                  Logout
                </button>
              </div>
            </div>

            {/* SEGURANÇA */}
            <div className={styles.window}>
              <Titlebar label="Segurança" />
              <div className={styles.formBody}>
                <SectionTitle label="Senha" />
                <div className={styles.field}>
                  <label>Senha atual</label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={handleChange('password')}
                    className={emptyPassword ? styles.inputError : ''}
                  />
                  {emptyPassword && <span className={styles.errorMsg}>Senha obrigatória</span>}
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
                    <input type="text" value="Selene" disabled />
                  </div>
                  <div className={styles.field}>
                    <label>Próxima cobrança</label>
                    <input type="text" value="10/05/2026" disabled />
                  </div>
                  <div className={styles.field}>
                    <label>Status</label>
                    <input type="text" value={membership === 1 ? 'Ativo' : 'Desativado'} disabled />
                  </div>
                </div>
                <button className={styles.memberShipCancel} onClick={() => setOpen(true)}>
                  Desativar assinatura
                </button>
              </div>
            </div>

          </div>

          <div className={styles.btnRow}>
            <button className={styles.save}>Salvar alterações</button>
            <button className={styles.discard} onClick={() => navigate('/home')}>
              Cancelar
            </button>
          </div>

        </div>
      </div>

      {/* MODAL LOGOUT */}
      {openLogout && (
        <div className={styles.overlay}>
          <div className={styles.modal}>
            <span onClick={() => setOpenLogout(false)} className={styles.modalClose}>✕</span>
            <SectionTitle label="Sair da conta" />
            <p className={styles.modalSubtitle}>
              Você tem certeza que deseja sair?
            </p>
            <div className={styles.modalBtnRow}>
              <button className={styles.logoutConfirm} onClick={handleLogout}>
                Sim
              </button>
              <button className={styles.logoutCancel} onClick={() => setOpenLogout(false)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CANCELAR ASSINATURA */}
      {open && (
        <div className={styles.overlay}>
          <div className={styles.modal}>
            <span onClick={() => setOpen(false)} className={styles.modalClose}>✕</span>
            <SectionTitle label="Confirmar cancelamento" />
            <p className={styles.modalSubtitle}>
              Tem certeza que deseja cancelar sua assinatura?
            </p>
            <div className={styles.field} style={{ width: '100%' }}>
              <label>Confirme sua senha</label>
              <input
                type="password"
                value={modalPassword}
                onChange={(e) => setModalPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <button
              className={styles.memberShipCancel}
              onClick={() => {
                if (modalPassword.trim() === '') return;
                setOpen(false);
                setMembership(0);
                setModalPassword('');
              }}
            >
              Confirmar cancelamento
            </button>
          </div>
        </div>
      )}

    </div>
  );
}