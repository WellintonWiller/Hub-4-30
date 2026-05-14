import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Moodboard from '../components/Moodboard';
import Whiteboard from '../components/Whiteboard';
import { useProject } from '../hooks/useProject';

export default function ProjectView({ user }: { user: any }) {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { project, assets, elements, cursors, updateTitle, addAsset, removeAsset, updateAsset, addElement, updateElement, removeElement, updateCursor, deleteProject } = useProject(projectId, user?.uid);
  const [view, setView] = useState<'moodboard' | 'whiteboard'>(location.state?.defaultView || 'moodboard');
  
  useEffect(() => {
    if (project === undefined) {
      // Internal loading state of useProject
    }
  }, [project]);

  if (!project) return <div className="bg-[#121212] w-screen h-screen flex text-white font-sans items-center justify-center font-bold tracking-widest text-[#FF4500]">LOADING...</div>;

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
           user={user} 
           setView={setView} 
           deleteProject={handleDeleteProject}
        />
      ) : (
        <Whiteboard 
           project={project} 
           assets={assets}
           removeAsset={removeAsset}
           updateAsset={updateAsset}
           elements={elements}
           cursors={cursors}
           addElement={addElement}
           updateElement={updateElement}
           removeElement={removeElement}
           updateCursor={updateCursor}
           updateTitle={updateTitle} 
           user={user} 
           setView={setView} 
        />
      )}
    </>
  );
}
