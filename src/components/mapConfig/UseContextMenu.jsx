import { useEffect, useRef, useState } from 'react'

export default function UseContextMenu() {
    const [menu, setMenu] = useState({ visible: false, x: 0, y: 0, targetId: null });
    const menuRef = useRef(null);

    const openMenu = (e, targetId = null) => {
        e.preventDefault(); // bloqueia o context menu do navegador
        e.stopPropagation();
        setMenu({ visible: true, x: e.pageX, y: e.pageY, targetId });
    };

    const closeMenu = () => setMenu((m) => ({
        ...m, visible: false //Mantém os outros atributos intactos
    }));

    useEffect(() => {
        //Verifica clicar fora, esc e rolar pagina
        const handleClick = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                closeMenu();
            }
        };
        const handleEsc = (e) => e.key === "Escape" && closeMenu();

        document.addEventListener("click", handleClick);
        document.addEventListener("scroll", closeMenu, true);
        document.addEventListener("keydown", handleEsc);
        return () => {
            document.removeEventListener("click", handleClick);
            document.removeEventListener("scroll", closeMenu, true);
            document.removeEventListener("keydown", handleEsc);
        };
    }, []);

    return { menu, openMenu, closeMenu, menuRef };
}