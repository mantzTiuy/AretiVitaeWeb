import styles from "./modules/charCounter.module.css";

// Indicador pequeno e reutilizável de "atual/limite" de caracteres. Hoje só
// é usado no nome dos containers (Settings.jsx), mas é genérico o
// bastante pra qualquer outro campo com limite de texto que apareça no
// futuro (ex: se o label de blocos "group" ganhar um limite parecido).
function CharCounter({ current, max }) {
  const remaining   = max - current;
  const isAtLimit   = remaining <= 0;
  const isNearLimit = !isAtLimit && remaining <= Math.ceil(max * 0.2);

  const stateClass = isAtLimit ? styles.limit : isNearLimit ? styles.warning : "";

  return (
    <span className={`${styles.counter} ${stateClass}`}>
      {current}/{max}
    </span>
  );
}

export default CharCounter;