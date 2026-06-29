import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import styles from './modules/CreateCanvas.module.css';
import CanvasTopDisplay from './Canvastopdisplay';
import SectionTitle from './Sectiontitle';
import SizeSelector from './Sizeselector';
import MapCarousel from './Mapcarousel';

export default function CreateCanvas() {
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', description: '' });
  const [size, setSize] = useState('1×');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  const emptyName   = form.name.trim() === '';
  const nameTooLong = form.name.length > 32;
  const descTooLong = form.description.length > 240;
  const camposVazios = emptyName || nameTooLong || descTooLong;

  async function handleCadastro() {
    if (camposVazios || loading) return;

    setLoading(true);
    setErro('');

    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const userId = user?.id;

      if (!userId) {
        setErro('Usuário não identificado. Faça login novamente.');
        return;
      }

      const dataInicial = JSON.stringify({ objects: [], /*background: '#94c0e3'*/ });

      const { data } = await axios.post('http://localhost:8081/apiAvMap/Register', {
        userId: userId,
        title: form.name,
        description: form.description,
        data: dataInicial,
      });

      navigate(`/canvas/${data.id}`);
    } catch (error) {
      console.log('ERRO COMPLETO:', error);
      console.log('RESPOSTA:', error.response);
      setErro(error.response?.data?.message || 'Erro, resolveremos isso logo');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.root}>

      <div className={styles.display}>
        <CanvasTopDisplay />
      </div>

      <div className={styles.bodyWrapper}>
        <div className={styles.body}>

          <div className={styles.window}>
            <div className={styles.titlebar}>
              <span className={styles.titlebarLabel}>Novo canvas</span>
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
                  placeholder="Ex.: AretiVitae"
                  className={nameTooLong ? styles.inputError : ''}
                />
                {emptyName && <span className={styles.errorMsg}>Nome obrigatório</span>}
                {!emptyName && nameTooLong && (
                  <span className={styles.errorMsg}>Máx 32 caracteres ({form.name.length}/32)</span>
                )}
              </div>

              <SectionTitle label="Tamanho" />

              <div className={styles.field}>
                <label>Escala do canvas</label>
                <SizeSelector value={size} onChange={setSize} />
              </div>

              <SectionTitle label="Descrição" />

              <div className={styles.field}>
                <label>Descrição do canvas</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Seja livre e descreva sua ideia aqui..."
                  maxLength={240}
                  className={descTooLong ? styles.inputError : ''}
                />
              </div>
              <p className={styles.charCount}>{form.description.length}/240</p>

              {erro && <p className={styles.errorMsg}>{erro}</p>}

              <div className={styles.btnRow}>
                <button
                  className={styles.save}
                  onClick={handleCadastro}
                  disabled={loading || camposVazios}
                >
                  {loading ? 'Criando...' : 'Criar canvas'}
                </button>
                <button className={styles.discard} onClick={() => navigate('/home')}>
                  Cancelar
                </button>
              </div>

            </div>
          </div>

          <MapCarousel />

        </div>
      </div>

    </div>
  );
}