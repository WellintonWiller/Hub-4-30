import { useState, useEffect, useRef, useCallback } from 'react';
import localforage from 'localforage';

export function useProject(projectId: string | undefined, userId: string | undefined) {
  const [project, setProject] = useState<any>(null);
  const [assets, setAssets] = useState<any[]>([]);
  const [cursors, setCursors] = useState<any[]>([]);
  
  // Single state for whiteboard elements and history
  const [boardState, setBoardState] = useState<{
    elements: any[],
    history: any[][],
    redoStack: any[][]
  }>({
    elements: [],
    history: [[]],
    redoStack: []
  });

  const elementsRef = useRef<any[]>([]);
  useEffect(() => {
    elementsRef.current = boardState.elements;
  }, [boardState.elements]);

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
        const els = storedElements || [];
        setBoardState({
          elements: els,
          history: [els],
          redoStack: []
        });
        elementsRef.current = els;
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

  const updateProject = async (updates: any) => {
    if (!projectId) return;
    const allProjects: any = await localforage.getItem('all_projects') || [];
    const idx = allProjects.findIndex((p: any) => p.id === projectId);
    if (idx !== -1) {
      allProjects[idx] = { ...allProjects[idx], ...updates };
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

  const addElement = useCallback((elementData: any) => {
    if (!projectId) return;
    const newElement = { 
      ...elementData, 
      id: elementData.id || Date.now().toString() + Math.random().toString(36).substring(7), 
      createdAt: new Date().toISOString() 
    };
    
    setBoardState(prev => {
      const updated = [...prev.elements, newElement];
      localforage.setItem(`elements_${projectId}`, updated);
      return {
        elements: updated,
        history: [...prev.history, updated].slice(-50),
        redoStack: []
      };
    });
  }, [projectId]);

  const addElements = useCallback((newEls: any[]) => {
    if (!projectId || newEls.length === 0) return;
    setBoardState(prev => {
      const updated = [...prev.elements, ...newEls];
      localforage.setItem(`elements_${projectId}`, updated);
      return {
        elements: updated,
        history: [...prev.history, updated].slice(-50),
        redoStack: []
      };
    });
  }, [projectId]);

  const persistTimeoutRef = useRef<any>(null);

  const updateElement = useCallback((elementId: string, updates: any, skipHistory = false) => {
    if (!projectId) return;
    
    setBoardState(prev => {
      const updated = prev.elements.map((el: any) => 
        el.id === elementId ? { ...el, ...updates } : el
      );

      if (persistTimeoutRef.current) clearTimeout(persistTimeoutRef.current);
      persistTimeoutRef.current = setTimeout(() => {
        localforage.setItem(`elements_${projectId}`, updated);
      }, 150);

      if (skipHistory) {
        return { ...prev, elements: updated };
      }

      const history = prev.history.length >= 50
        ? [...prev.history.slice(-49), updated]
        : [...prev.history, updated];
      return {
        elements: updated,
        history,
        redoStack: []
      };
    });
  }, [projectId]);

  const updateElements = useCallback((elementUpdates: { id: string, updates: any }[], skipHistory = false) => {
    if (!projectId || elementUpdates.length === 0) return;
    
    setBoardState(prev => {
      const updateMap = new Map(elementUpdates.map(u => [u.id, u.updates]));
      const updated = prev.elements.map((el: any) => {
        const u = updateMap.get(el.id);
        return u ? { ...el, ...u } : el;
      });

      if (persistTimeoutRef.current) clearTimeout(persistTimeoutRef.current);
      persistTimeoutRef.current = setTimeout(() => {
        localforage.setItem(`elements_${projectId}`, updated);
      }, 150);

      if (skipHistory) {
        return { ...prev, elements: updated };
      }

      const history = prev.history.length >= 50
        ? [...prev.history.slice(-49), updated]
        : [...prev.history, updated];
      return {
        elements: updated,
        history,
        redoStack: []
      };
    });
  }, [projectId]);

  const removeElement = useCallback((elementId: string) => {
    if (!projectId) return;
    setBoardState(prev => {
      const updated = prev.elements.filter((el: any) => el.id !== elementId);
      localforage.setItem(`elements_${projectId}`, updated);
      return {
        elements: updated,
        history: [...prev.history, updated].slice(-50),
        redoStack: []
      };
    });
  }, [projectId]);

  const undo = useCallback(() => {
    setBoardState(prev => {
      if (prev.history.length <= 1) return prev;
      
      const newHistory = [...prev.history];
      const current = newHistory.pop();
      const previous = newHistory[newHistory.length - 1];
      
      localforage.setItem(`elements_${projectId}`, previous);
      return {
        elements: previous,
        history: newHistory,
        redoStack: [...prev.redoStack, current]
      };
    });
  }, [projectId]);

  const redo = useCallback(() => {
    setBoardState(prev => {
      if (prev.redoStack.length === 0) return prev;
      
      const newRedoStack = [...prev.redoStack];
      const next = newRedoStack.pop();
      
      localforage.setItem(`elements_${projectId}`, next);
      return {
        elements: next,
        history: [...prev.history, next],
        redoStack: newRedoStack
      };
    });
  }, [projectId]);

  const bringToFront = useCallback((elementIds: string[]) => {
    setBoardState(prev => {
      const selected = prev.elements.filter(el => elementIds.includes(el.id));
      const others = prev.elements.filter(el => !elementIds.includes(el.id));
      const updated = [...others, ...selected];
      localforage.setItem(`elements_${projectId}`, updated);
      return { ...prev, elements: updated, history: [...prev.history, updated].slice(-50), redoStack: [] };
    });
  }, [projectId]);

  const sendToBack = useCallback((elementIds: string[]) => {
    setBoardState(prev => {
      const selected = prev.elements.filter(el => elementIds.includes(el.id));
      const others = prev.elements.filter(el => !elementIds.includes(el.id));
      const updated = [...selected, ...others];
      localforage.setItem(`elements_${projectId}`, updated);
      return { ...prev, elements: updated, history: [...prev.history, updated].slice(-50), redoStack: [] };
    });
  }, [projectId]);

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
    elements: boardState.elements,
    cursors,
    updateTitle,
    updateProject,
    addAsset,
    removeAsset,
    updateAsset,
    addElement,
    addElements,
    updateElement,
    updateElements,
    removeElement,
    undo,
    redo,
    deleteProject,
    updateCursor,
    bringToFront,
    sendToBack,
    canUndo: boardState.history.length > 1,
    canRedo: boardState.redoStack.length > 0
  };
}
