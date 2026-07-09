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

  const emptyName   = form.name.trim() === '';
  const nameTooLong = form.name.length > 32;
  const descTooLong = form.description.length > 2000;
  const camposVazios = emptyName || nameTooLong || descTooLong;

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
      await axios.put(`http://localhost:8081/apiAvMap/${id}`, {
        title: form.name,
        description: form.description,
      });

      navigate(`/canvas/${id}`);
    } catch (error) {
      console.log('ERRO COMPLETO:', error);
      console.log('RESPOSTA:', error.response);
      setErro(error.response?.data?.message || 'Erro, resolveremos isso logo');
    } finally {
      setLoading(false);
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
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}