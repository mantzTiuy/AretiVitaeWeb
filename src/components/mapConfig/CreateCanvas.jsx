import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './modules/CreateCanvas.module.css';
import CanvasTopDisplay from './Canvastopdisplay';
import SectionTitle from './Sectiontitle';
import SizeSelector from './Sizeselector';
import MapCarousel from './Mapcarousel';

export default function CreateCanvas() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    description: '',
  });

  const [size, setSize] = useState('1×');

  const handleChange = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const emptyName   = form.name.trim() === '';
  const nameTooLong = form.name.length > 32;
  const descTooLong = form.description.length > 240;

  const handleSubmit = () => {
    if (emptyName || nameTooLong || descTooLong) return;
    navigate('/home');
  };

  return (
    <div className={styles.root}>

      <CanvasTopDisplay />

      <div className={styles.bodyWrapper}>
        <div className={styles.body}>

          {/* ── PAGE HEADER ── */}
          <div className={styles.pageHeader}>
            <div className={styles.pageHeaderText}>
              <h1>Novo canvas</h1>
              <p>Preencha as informações para criar seu canvas</p>
            </div>
          </div>

          {/* ── FORM CARD ── */}
          <div className={styles.formCard}>

            <SectionTitle label="Identificação" />

            <div className={styles.field}>
              <label>Nome do canvas</label>
              <input
                type="text"
                value={form.name}
                onChange={handleChange('name')}
                placeholder="Ex.: Projeto Aurora"
                className={emptyName || nameTooLong ? styles.inputError : ''}
              />
              {emptyName && (
                <span className={styles.errorMsg}>Nome obrigatório</span>
              )}
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
                onChange={handleChange('description')}
                placeholder="Descreva o propósito, contexto ou observações do canvas..."
                maxLength={240}
                className={descTooLong ? styles.inputError : ''}
              />
            </div>
            <p className={styles.charCount}>
              {form.description.length}/240
            </p>

            <button className={styles.save} onClick={handleSubmit}>
              Criar canvas
            </button>

            <button className={styles.discard} onClick={() => navigate('/home')}>
              Cancelar
            </button>

          </div>

          {/* ── CAROUSEL ── */}
          <MapCarousel onSelect={(map) => console.log('Abrir mapa:', map.name)} />

        </div>
      </div>

    </div>
  );
}