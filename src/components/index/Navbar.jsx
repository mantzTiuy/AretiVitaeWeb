import styles from "./modules/navbar.module.css";
import BackButton from "./BackButton";

function Navbar() {
  return (
    <div className={styles.navbar}>
      <div className={styles.topAV}>
        <BackButton />
      </div>
    </div>
  );
}

export default Navbar;