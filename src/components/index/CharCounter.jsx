import styles from "./modules/charCounter.module.css";

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