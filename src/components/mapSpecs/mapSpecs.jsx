import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import styles from './modules/mapSpecs.module.css';
import CanvasStarBackground from './CanvasStarBackground';
import SectionTitle from './SectionTitle';

export default function MapSpecs() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [form, setForm] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [nameTouched, setNameTouched] = useState(false);

  const [showDeleteModal, setShowDeleteModal]   = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting]                 = useState(false);
  const [erroDelete, setErroDelete]             = useState('');

  const emptyName   = form.name.trim() === '';
  const nameTooLong = form.name.length > 32;
  const descTooLong = form.description.length > 2000;
  const camposVazios = emptyName || nameTooLong || descTooLong;

  const deleteNameMatches = deleteConfirmText === form.name;

  useEffect(() => {
    async function carregarCanvas() {
      try {
        const { data } = await axios.get(`http://localhost:8081/apiAvMap/${id}`);
        setForm({ name: data.title, description: data.description });
      } catch (error) {
        console.log('ERRO AO CARREGAR:', error);
        setErro('Não foi possível carregar o canvas');
      } finally {
        setCarregando(false);
      }
    }
    carregarCanvas();
  }, [id]);

  async function handleSalvar() {
    setNameTouched(true);

    if (camposVazios || loading) return;

    setLoading(true);
    setErro('');

    try {
      await axios.put(`http://localhost:8081/apiAvMap/update/${id}`, {
        title: form.name,
        description: form.description,
      });

      navigate(`/create`);
    } catch (error) {
      console.log('ERRO COMPLETO:', error);
      console.log('RESPOSTA:', error.response);
      setErro(error.response?.data?.message || 'Erro, resolveremos isso logo');
    } finally {
      setLoading(false);
    }
  }

  function abrirModalExclusao() {
    setDeleteConfirmText('');
    setErroDelete('');
    setShowDeleteModal(true);
  }

  function fecharModalExclusao() {
    if (deleting) return; 
    setShowDeleteModal(false);
    setDeleteConfirmText('');
    setErroDelete('');
  }

  async function handleExcluir() {
    if (!deleteNameMatches || deleting) return;

    setDeleting(true);
    setErroDelete('');

    try {
      
      await axios.put(`http://localhost:8081/apiAvMap/update/${id}`, {
        ativo: 1,
      });

      navigate('/create');
    } catch (error) {
      console.log('ERRO AO EXCLUIR:', error);
      setErroDelete(error.response?.data?.message || 'Erro, resolveremos isso logo');
    } finally {
      setDeleting(false);
    }
  }

  if (carregando) {
    return (
      <div className={styles.root}>
        <CanvasStarBackground />
        <div className={styles.bodyWrapper}>
          <p className={styles.loadingText}>Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <CanvasStarBackground />

      <div className={styles.bodyWrapper}>
        <div className={styles.window}>
          <div className={styles.titlebar}>
            <span className={styles.titlebarLabel}>Especificações do canvas</span>
            <div className={styles.dots}>
              <div className={`${styles.dot} ${styles.dotGray}`} />
              <div className={`${styles.dot} ${styles.dotYellow}`} />
              <div className={`${styles.dot} ${styles.dotRed}`} />
            </div>
          </div>

          <div className={styles.formBody}>

            <SectionTitle label="Identificação" />

            <div className={styles.field}>
              <label>Nome do canvas</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                onBlur={() => setNameTouched(true)}
                placeholder="Ex.: AretiVitae"
                className={nameTooLong ? styles.inputError : ''}
              />
              {nameTouched && emptyName && (
                <span className={styles.errorMsg}>Nome obrigatório</span>
              )}
              {nameTouched && !emptyName && nameTooLong && (
                <span className={styles.errorMsg}>Máx 32 caracteres ({form.name.length}/32)</span>
              )}
            </div>

            <SectionTitle label="Descrição" />

            <div className={styles.field}>
              <label>Descrição do canvas</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Seja livre e descreva sua ideia aqui..."
                maxLength={2000}
                className={descTooLong ? styles.inputError : ''}
              />
            </div>
            <p className={styles.charCount}>{form.description.length}/2000</p>

            {erro && <p className={styles.errorMsg}>{erro}</p>}

            <div className={styles.btnRow}>
              <button
                className={styles.save}
                onClick={handleSalvar}
                disabled={loading || camposVazios}
              >
                {loading ? 'Salvando...' : 'Salvar alterações'}
              </button>
              <button className={styles.discard} onClick={() => navigate('/create')}>
                Cancelar
              </button>
              <button className={styles.delete} onClick={abrirModalExclusao}>
                Excluir
              </button>
            </div>

          </div>
        </div>
      </div>

      {showDeleteModal && (
        <div className={styles.modalOverlay} onClick={fecharModalExclusao}>
          <div className={styles.modalWindow} onClick={(e) => e.stopPropagation()}>
            <div className={styles.titlebar}>
              <span className={styles.titlebarLabel}>Excluir canvas</span>
              <div className={styles.dots}>
                <div className={`${styles.dot} ${styles.dotGray}`} />
                <div className={`${styles.dot} ${styles.dotYellow}`} />
                <div className={`${styles.dot} ${styles.dotRed}`} />
              </div>
            </div>

            <div className={styles.modalBody}>
              <p className={styles.modalText}>
                Tem certeza que deseja excluir o canvas <strong>{form.name}</strong>?
                Essa ação não pode ser desfeita.
              </p>
              <p className={styles.modalText}>
                Para confirmar, digite <strong>{form.name}</strong> abaixo:
              </p>

              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder={form.name}
                className={styles.modalInput}
                autoFocus
              />

              {erroDelete && <p className={styles.errorMsg}>{erroDelete}</p>}

              <div className={styles.btnRow}>
                <button
                  className={styles.deleteConfirm}
                  onClick={handleExcluir}
                  disabled={!deleteNameMatches || deleting}
                >
                  {deleting ? 'Excluindo...' : 'Excluir definitivamente'}
                </button>
                <button
                  className={styles.discard}
                  onClick={fecharModalExclusao}
                  disabled={deleting}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}