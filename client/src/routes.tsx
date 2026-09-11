import { Routes, Route } from 'react-router-dom';
     import Home from './pages/Home';
     import Charging from './pages/Charging';
     import Community from './pages/Community';
     import Map from './pages/Map';
     import NotFound from './pages/NotFound';
     import Maintenance from './pages/Maintenance';

     const AppRoutes: React.FC = () => (
       <Routes>
         <Route path="/" element={<Home />} />
         <Route path="/charging" element={<Charging />} />
         <Route path="/community" element={<Community />} />
         <Route path="/map" element={<Map />} />
         <Route path="*" element={<NotFound />} />
         <Route path="/maintenance" element={<Maintenance />} />
       </Routes>
     );

     export default AppRoutes;