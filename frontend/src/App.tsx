import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./Login";
import Signup from "./Signup";
import Homepage from "./Homepage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"       element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/home"   element={<Homepage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;