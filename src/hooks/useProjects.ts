import { useState, useEffect } from 'react';
import localforage from 'localforage';

export function useProjects(userId: string | undefined) {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setProjects([]);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    localforage.getItem('all_projects').then(async (stored: any) => {
      const allProjects = stored || [];
      const userProjects = allProjects.filter((p: any) => p.ownerId === userId);
      
      const projectsWithCovers = await Promise.all(userProjects.map(async (p: any) => {
        const assets: any = await localforage.getItem(`assets_${p.id}`) || [];
        const images = assets.filter((a: any) => a.type === 'image');
        const coverUrl = images.length > 0 ? (images[0].url || images[0].src) : `https://picsum.photos/seed/${p.id}/800/800`;
        return {
          ...p,
          coverUrl
        };
      }));

      setProjects(projectsWithCovers);
      setLoading(false);
    });
  }, [userId]);

  const createProject = async () => {
    if (!userId) throw new Error("User required");
    const newProject = {
      id: Math.random().toString(36).substring(7),
      name: '',
      ownerId: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    const allProjects: any = await localforage.getItem('all_projects') || [];
    allProjects.push(newProject);
    await localforage.setItem('all_projects', allProjects);
    
    setProjects(allProjects.filter((p: any) => p.ownerId === userId));
    return newProject.id;
  };

  const renameProject = async (projectId: string, newName: string) => {
    if (!userId) throw new Error("User required");
    const allProjects: any = await localforage.getItem('all_projects') || [];
    const updatedProjects = allProjects.map((p: any) => p.id === projectId ? { ...p, name: newName, updatedAt: new Date().toISOString() } : p);
    await localforage.setItem('all_projects', updatedProjects);
    
    const userProjects = updatedProjects.filter((p: any) => p.ownerId === userId);
    const projectsWithCovers = await Promise.all(userProjects.map(async (p: any) => {
      const assets: any = await localforage.getItem(`assets_${p.id}`) || [];
      const images = assets.filter((a: any) => a.type === 'image');
      const coverUrl = images.length > 0 ? (images[0].url || images[0].src) : `https://picsum.photos/seed/${p.id}/800/800`;
      return { ...p, coverUrl };
    }));
    
    setProjects(projectsWithCovers);
  };

  const deleteProject = async (projectId: string) => {
    if (!userId) throw new Error("User required");
    const allProjects: any = await localforage.getItem('all_projects') || [];
    const updatedProjects = allProjects.filter((p: any) => p.id !== projectId);
    await localforage.setItem('all_projects', updatedProjects);
    
    // Also remove assets and elements? Optional for now or good practice
    await localforage.removeItem(`assets_${projectId}`);
    await localforage.removeItem(`elements_${projectId}`);

    const userProjects = updatedProjects.filter((p: any) => p.ownerId === userId);
    const projectsWithCovers = await Promise.all(userProjects.map(async (p: any) => {
      const assets: any = await localforage.getItem(`assets_${p.id}`) || [];
      const images = assets.filter((a: any) => a.type === 'image');
      const coverUrl = images.length > 0 ? (images[0].url || images[0].src) : `https://picsum.photos/seed/${p.id}/800/800`;
      return { ...p, coverUrl };
    }));
    setProjects(projectsWithCovers);
  };

  return { projects, loading, createProject, renameProject, deleteProject };
}
