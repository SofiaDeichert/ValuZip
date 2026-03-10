import MapView from './components/Map/MapView';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import MapPage from './pages/MapPage';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<MapPage />} />
        </Routes>
      </Layout>
    </Router>
  );
}
export default App;
