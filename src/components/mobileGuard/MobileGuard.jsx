import { Navigate, Outlet, useLocation } from "react-router-dom";



function isMobileDevice() {
  const mobileUA = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const smallScreen = window.innerWidth <= 768;
  return mobileUA || smallScreen;
}

function MobileGuard() {
  const location = useLocation();
  const mobile = isMobileDevice();
  console.log("MobileGuard rodou:", { mobile, pathname: location.pathname });

  if (mobile && location.pathname !== "/acesso-mobile") {
    return <Navigate to="/acesso-mobile" replace />;
  }

  return <Outlet />;
}

export default MobileGuard;