import { BrowserRouter, Routes, Route } from "react-router-dom";
import Test from "./pages/Test";
import Navigation from "./pages/Navigation";
import Dictionary from "./pages/Dictionary";
import Navbar from "./components/Navbar";
import Quiz  from "./pages/Quiz";
import "./App.css";

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Navigation />} />
        <Route path="/test" element={<Test />} />
        <Route path="/dictionary" element={<Dictionary />} />
        <Route path="/quiz" element={<Quiz />} />
      </Routes>
    </BrowserRouter>
  );
}
