import "./App.css";
import Home from "./components/home/Home";
import Index from "./components/index/Index";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./components/login/LoginAV";
import React, { useEffect } from "react";
import NetworkDemo from "./components/networkdemo/NetworkDemo.jsx"
import Account from "./components/account/Account";
import About from "./components/about/About";
import NetConfig from "./components/networkcreation/Notespage.jsx"
import CreateCanvas from "./components/mapConfig/CreateCanvas.jsx";
import MapSpecs from "./components/mapSpecs/mapSpecs.jsx";
import AssinaturaQrCode from "./components/compra/AssinaturaQrCode.jsx";
import MobileGuard from "./components/mobileGuard/MobileGuard.jsx";
import AcessoMobile from "./components/mobileGuard/AcessoMobile.jsx";

function App() {

  useEffect(() => {
    const handleWheel = (e) => { if (e.ctrlKey) e.preventDefault() };
    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "+" || e.key === "-" || e.key === "=" || e.key === "0") {
          e.preventDefault();
        }
      }
    };
    const handleGesture = (e) => e.preventDefault();

    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("gesturestart", handleGesture);
    window.addEventListener("gesturechange", handleGesture);
    window.addEventListener("gestureend", handleGesture);

    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("gesturestart", handleGesture);
      window.removeEventListener("gesturechange", handleGesture);
      window.removeEventListener("gestureend", handleGesture);
    };
  }, []);

  return (
    <Router>
      <Routes>
     
        <Route path="/acesso-mobile" element={<AcessoMobile />} />

        {/* tudo aqui dentro passa pela checagem de mobile primeiro */}
        <Route element={<MobileGuard />}>
          <Route path="/"                  element={<Login />} />
          <Route path="/login"             element={<Login />} />
          <Route path="/home"              element={<Home />} />
          <Route path="/canvas/:id"        element={<Index />} />
          <Route path="/account"           element={<Account />} />
          <Route path="/networkdemo"       element={<NetworkDemo />} />
          <Route path="/sobre"             element={<About />} />
          <Route path="/notes"             element={<NetConfig />} />
          <Route path="/create"            element={<CreateCanvas />} />
          <Route path="/canvas/:id/editar" element={<MapSpecs />} />
          <Route path="/compra/:planoId"   element={<AssinaturaQrCode />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;