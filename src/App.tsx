import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import ProjectView from './pages/ProjectView';
import { GlobalCursor } from './components/GlobalCursor';

export default function App() {
  const [user, setUser] = useState<any>({ uid: 'local', displayName: 'Local User', photoURL: null });

  return (
    <BrowserRouter>
      <GlobalCursor />
      <Routes>
        <Route path="/" element={<Dashboard user={user} />} />
        <Route path="/project/:projectId" element={<ProjectView user={user} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
