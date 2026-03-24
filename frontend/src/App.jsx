import MapView from './components/Map/MapView';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import MapPage from './pages/MapPage';
import ZipDetailPage from './pages/ZipDetailPage';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<MapPage />} />
          <Route path="/zip/:zip" element={<ZipDetailPage />} />
        </Routes>
      </Layout>
    </Router>
  );
}
export default App;