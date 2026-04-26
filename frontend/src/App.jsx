import { BrowserRouter, Routes, Route } from "react-router-dom";
import RFQList from "./pages/RFQList";
import RFQDetails from "./pages/RFQDetails";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RFQList />} />
        <Route path="/rfq/:rfqId" element={<RFQDetails />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;