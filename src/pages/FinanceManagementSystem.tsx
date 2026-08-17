import { Navigate, useLocation } from "react-router-dom";

const BASE_PATH = "/finance-management-system/fms/praavi-internal";
const ADMIN_PATH = `${BASE_PATH}/admin`;
const FINANCE_PATH = `${BASE_PATH}/finance-team`;
const APP_PATH = `${BASE_PATH}/app/index.html`;

const FinanceManagementSystem = () => {
  const { pathname } = useLocation();
  const isFinanceRoute = pathname === FINANCE_PATH || pathname.startsWith(`${FINANCE_PATH}/`);
  const isAdminRoute = pathname === ADMIN_PATH || pathname.startsWith(`${ADMIN_PATH}/`);

  if (!isAdminRoute && !isFinanceRoute) {
    return <Navigate to={FINANCE_PATH} replace />;
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-white">
      <iframe
        title={isAdminRoute ? "Praavi Finance Admin Dashboard" : "Praavi Finance Team Dashboard"}
        src={APP_PATH}
        className="h-full w-full border-0"
      />
    </div>
  );
};

export default FinanceManagementSystem;
