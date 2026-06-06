import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./Login";
import Homepage from "./Homepage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/home" element={<Homepage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;