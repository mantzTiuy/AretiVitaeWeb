import { useEffect, useState } from "react";
import StarBackground from "./Starbackground";
import WinTitleBar   from "./Wintitlebar.jsx";
import NotesGrid     from "./Notesgrid";
import NewNoteModal  from "./Newnotemodal.jsx";
import styles from "./modules/Notespage.module.css";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const TITLE_LIMIT = 55;
const DESC_LIMIT  = 2500;

export default function NotesPage() {
  const navigate = useNavigate();
  const [notes,     setNotes]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [erro,      setErro]      = useState(null);
  const [showModal, setShowModal] = useState(false);

  const [titulo,    setTitulo]    = useState("");
  const [descricao, setDescricao] = useState("");

  const emptyTitle = titulo.trim() === "";
  const toLongDesc = descricao.length > DESC_LIMIT;
  const toLogTitle = titulo.length > TITLE_LIMIT;

  const camposVazios = emptyTitle || toLongDesc || toLogTitle;

  useEffect(() => {
    let cancel = false;

    async function load() {
      const userStr = localStorage.getItem("user");

      if (!userStr) {
        if (!cancel) {
          setErro("Usuário não encontrado. Faça login novamente.");
          setLoading(false);
        }
        return;
      }

      let userId;
      try {
        userId = JSON.parse(userStr).id;
      } catch {
        userId = null;
      }

      if (!userId) {
        if (!cancel) {
          setErro("Usuário não encontrado. Faça login novamente.");
          setLoading(false);
        }
        return;
      }

      try {
        const { data } = await axios.get(`http://localhost:8081/apiAvNotes/User/${userId}`);
        if (!cancel) setNotes(data);
      } catch (er) {
        console.log("Erro ao carregar notas:", er);

        const status = er.response?.status;

        // Usuário sem notas ainda: o backend responde 404/400 nesse caso,
        // então isso não é erro de verdade — é lista vazia.
        if (status === 404 || status === 400) {
          if (!cancel) setNotes([]);
        } else {
          if (!cancel) setErro("Erro ao carregar as notas. Tente novamente.");
        }
      } finally {
        if (!cancel) setLoading(false);
      }
    }

    load();

    return () => { cancel = true; };
  }, []);


  async function handleRegister(){
    if(loading || camposVazios) return;

    setLoading(true)
    setErro('');

    try{
      const user = JSON.parse(localStorage.getItem('user'));
      const userId = user?.id;

      if (!userId) {
        setErro('Usuário não identificado. Faça login novamente.');
        return;
      }

      const { data } = await axios.post('http://localhost:8081/apiAvNotes/Register', {
        userId: userId,
        title: titulo,
        note: descricao,
      });

      setNotes((prev) => [...prev, data]);
      setTitulo("");
      setDescricao("");
      setShowModal(false);
    } catch (er) {
      console.log("Erro ao registrar nota:", er);
      setErro("Não foi possível criar a nota.");
    } finally {
      setLoading(false);
    }
  }

  // `updates` agora é um objeto, ex: { title: "novo título", note: "novo texto" }
  // em vez de uma string solta — o NoteCard manda os dois campos juntos.
  const handleUpdate = async (idNota, updates) => {
    const anterior = notes;
    setNotes((prev) =>
      prev.map((n) => (n.id === idNota ? { ...n, ...updates } : n))
    );
    try {
      await axios.put(`http://localhost:8081/apiAvNotes/Update/${idNota}`, updates);
    } catch (er) {
      console.log("Erro ao atualizar nota:", er);
      setErro("Não foi possível salvar a alteração.");
      setNotes(anterior);
    }
  };

  const handleDelete = async (idNota) => {
    const anterior = notes;
    setNotes((prev) => prev.filter((n) => n.id !== idNota));
    try {
      await axios.put(`http://localhost:8081/apiAvNotes/Update/${idNota}`, {
        ativo: 1,
      });
    } catch (er) {
      console.log("Erro ao excluir nota:", er);
      setErro("Não foi possível excluir a nota.");
      setNotes(anterior);
    }
  };


  return (
    <div className={styles.page}>
      <StarBackground />

      {showModal && (
        <NewNoteModal
          titulo={titulo}
          onTituloChange={setTitulo}
          toLogTitle={toLogTitle}
          camposVazios={camposVazios}
          onConfirm={handleRegister}
          onClose={() => setShowModal(false)}
        />
      )}

      <div className={styles.outerWrap}>
        <div className={styles.winWindow}>

          <WinTitleBar
            title="Notas"
            onClose={() => window.history.back()}
          />

          <div className={styles.winHeader}>
            <div className={styles.winHeaderLeft}>
              <span className={styles.notesCount}>
                {notes.length} {notes.length === 1 ? "nota" : "notas"}{/*Plural */}
              </span>
            </div>
            <button className={styles.newBtn} onClick={() => setShowModal(true)}>
              <span>+</span> Nova nota
            </button>
          </div>

          {erro && <p className={styles.errorMsg}>{erro}</p>}

          {loading ? (
            <p></p>
          ) : (
            <NotesGrid
              notes={notes}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
              onAdd={() => setShowModal(true)}
            />
          )}

          <div className={styles.winFooter}>
            <button className={styles.discard} onClick={() => navigate('/home')}>Voltar</button>
          </div>

        </div>
      </div>
    </div>
  );
}