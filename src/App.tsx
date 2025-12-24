import { Route, Routes } from "react-router-dom";
import Home from "./Home";
import Rates from "./pages/Rates";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Submit from "./pages/Submit";
import Transactions from "./pages/Transactions";
import AdminDashboard from "./pages/AdminDashboard";
import MyProfile from "./pages/MyProfile";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/rates" element={<Rates />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Register />} />
      <Route path="/submit" element={<Submit />} />
      <Route path="/transactions" element={<Transactions />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/my-profile" element={<MyProfile />} />
    </Routes>
  )
}