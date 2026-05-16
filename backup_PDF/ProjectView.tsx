import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Moodboard from '../components/Moodboard';
import Whiteboard from '../components/Whiteboard';
import { useProject } from '../hooks/useProject';

import { SplashScreen } from '../components/SplashScreen';

export default function ProjectView({ user }: { user: any }) {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    project, assets, elements, cursors, updateTitle, updateProject, addAsset, removeAsset, updateAsset, 
    addElement, addElements, updateElement, removeElement, updateCursor, deleteProject,
    undo, redo, canUndo, canRedo, bringToFront, sendToBack 
  } = useProject(projectId, user?.uid);
  const [view, setView] = useState<'moodboard' | 'whiteboard'>(() => {
    const saved = sessionStorage.getItem(`lastView_${projectId}`);
    if (saved === 'whiteboard' || saved === 'moodboard') return saved;
    if (location.state?.defaultView) return location.state.defaultView;
    return 'moodboard';
  });

  useEffect(() => {
    if (projectId) {
      sessionStorage.setItem(`lastView_${projectId}`, view);
    }
  }, [view, projectId]);
  
  useEffect(() => {
    if (project === undefined) {
      // Internal loading state of useProject
    }
  }, [project]);

  if (!project) return <SplashScreen isLoading={true} />;

  const handleDeleteProject = async () => {
    if (window.confirm('Tem certeza que deseja deletar este projeto?')) {
      await deleteProject();
      navigate('/');
    }
  };

  return (
    <>
      {view === 'moodboard' ? (
        <Moodboard 
           projectId={projectId!} 
           project={project} 
           assets={assets}
           addAsset={addAsset}
           removeAsset={removeAsset}
           updateTitle={updateTitle} 
           updateProject={updateProject}
           user={user} 
           setView={setView} 
           deleteProject={handleDeleteProject}
        />
      ) : (
        <Whiteboard 
           project={project} 
           assets={assets}
           addAsset={addAsset}
           removeAsset={removeAsset}
           updateAsset={updateAsset}
           elements={elements}
           cursors={cursors}
           addElement={addElement}
           addElements={addElements}
           updateElement={updateElement}
           removeElement={removeElement}
           updateCursor={updateCursor}
           updateTitle={updateTitle} 
           updateProject={updateProject}
           user={user} 
           setView={setView} 
           undo={undo}
           redo={redo}
           canUndo={canUndo}
           canRedo={canRedo}
           bringToFront={bringToFront}
           sendToBack={sendToBack}
        />
      )}
    </>
  );
}
