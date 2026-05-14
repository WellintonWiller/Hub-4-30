import { useState, useEffect } from 'react';
import localforage from 'localforage';

export function useProject(projectId: string | undefined, userId: string | undefined) {
  const [project, setProject] = useState<any>(null);
  const [assets, setAssets] = useState<any[]>([]);
  const [elements, setElements] = useState<any[]>([]);
  const [cursors, setCursors] = useState<any[]>([]);

  // Fetch Project details
  useEffect(() => {
    if (!projectId) return;
    localforage.getItem('all_projects').then((stored: any) => {
      const allProjects = stored || [];
      const p = allProjects.find((p: any) => p.id === projectId);
      if (p) setProject(p);
    });
  }, [projectId]);

  // Fetch Assets (Moodboard)
  useEffect(() => {
    if (!projectId) return;
    localforage.getItem(`assets_${projectId}`).then((storedAssets: any) => {
      if (storedAssets) {
        setAssets(storedAssets);
      }
    });
  }, [projectId]);

  // Fetch Elements (Whiteboard)
  useEffect(() => {
    if (!projectId) return;
    localforage.getItem(`elements_${projectId}`).then((storedElements: any) => {
      if (storedElements) {
        setElements(storedElements);
      }
    });
  }, [projectId]);

  const updateTitle = async (name: string) => {
    if (!projectId) return;
    const allProjects: any = await localforage.getItem('all_projects') || [];
    const idx = allProjects.findIndex((p: any) => p.id === projectId);
    if (idx !== -1) {
      allProjects[idx].name = name.toUpperCase();
      await localforage.setItem('all_projects', allProjects);
      setProject(allProjects[idx]);
    }
  };

  const addAsset = async (assetData: any) => {
    if (!projectId) return;
    const current: any = await localforage.getItem(`assets_${projectId}`) || [];
    const newAsset = { ...assetData, id: Math.random().toString(36).substring(7), createdAt: new Date().toISOString() };
    const updated = [newAsset, ...current];
    await localforage.setItem(`assets_${projectId}`, updated);
    setAssets(updated);
  };

  const removeAsset = async (assetId: string) => {
    if (!projectId) return;
    const current: any = await localforage.getItem(`assets_${projectId}`) || [];
    const updated = current.filter((a: any) => a.id !== assetId);
    await localforage.setItem(`assets_${projectId}`, updated);
    setAssets(updated);
  };

  const updateAsset = async (assetId: string, updates: any) => {
    if (!projectId) return;
    const current: any = await localforage.getItem(`assets_${projectId}`) || [];
    const updated = current.map((a: any) => a.id === assetId ? { ...a, ...updates } : a);
    await localforage.setItem(`assets_${projectId}`, updated);
    setAssets(updated);
  };

  const addElement = async (elementData: any) => {
    if (!projectId) return;
    const current: any = await localforage.getItem(`elements_${projectId}`) || [];
    const newElement = { ...elementData, id: Math.random().toString(36).substring(7), createdAt: new Date().toISOString() };
    const updated = [...current, newElement];
    await localforage.setItem(`elements_${projectId}`, updated);
    setElements(updated);
  };

  const updateElement = async (elementId: string, updates: any) => {
    if (!projectId) return;
    const current: any = await localforage.getItem(`elements_${projectId}`) || [];
    const updated = current.map((el: any) => el.id === elementId ? { ...el, ...updates } : el);
    await localforage.setItem(`elements_${projectId}`, updated);
    setElements(updated);
  };

  const removeElement = async (elementId: string) => {
    if (!projectId) return;
    const current: any = await localforage.getItem(`elements_${projectId}`) || [];
    const updated = current.filter((el: any) => el.id !== elementId);
    await localforage.setItem(`elements_${projectId}`, updated);
    setElements(updated);
  };

  const deleteProject = async () => {
    if (!projectId) return;
    const allProjects: any = await localforage.getItem('all_projects') || [];
    const updatedProjects = allProjects.filter((p: any) => p.id !== projectId);
    await localforage.setItem('all_projects', updatedProjects);
    await localforage.removeItem(`assets_${projectId}`);
    await localforage.removeItem(`elements_${projectId}`);
  };

  const updateCursor = async (cursorData: any) => {
    // No-op for local-only functionality.
  };

  return {
    project,
    assets,
    elements,
    cursors,
    updateTitle,
    addAsset,
    removeAsset,
    updateAsset,
    addElement,
    updateElement,
    removeElement,
    updateCursor,
    deleteProject
  };
}
