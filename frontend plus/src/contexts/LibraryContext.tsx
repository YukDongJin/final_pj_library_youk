import React, { createContext, useContext, useState, useEffect } from "react";
import { LibraryItem, LibraryItemType, LibraryItemVisibility } from "@/types/library";
import { apiService } from "@/services/api";
import { mockLibraryItems } from "@/data/libraryMockData";

interface LibraryContextType {
  items: LibraryItem[];
  loading: boolean;
  error: string | null;
  addItem: (item: LibraryItem) => void;
  deleteItems: (itemIds: string[]) => Promise<void>;
  refreshItems: () => Promise<void>;
  getItemsByType: (type: LibraryItemType) => LibraryItem[];
  getItemsByVisibility: (visibility: LibraryItemVisibility) => LibraryItem[];
}

const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

export const useLibrary = () => {
  const context = useContext(LibraryContext);
  if (!context) {
    throw new Error("useLibrary must be used within a LibraryProvider");
  }
  return context;
};

export const LibraryProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // API에서 아이템 목록 가져오기
  const refreshItems = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await apiService.getMyLibraryItems();
      setItems(result.items);
    } catch (err) {
      console.error("API 호출 실패, Mock 데이터 사용:", err);
      setError("API 연결에 실패했습니다. Mock 데이터를 사용합니다.");
      // API 실패 시 Mock 데이터 사용
      setItems(mockLibraryItems);
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    refreshItems();
  }, []);

  const addItem = (newItem: LibraryItem) => {
    setItems((prevItems) => [newItem, ...prevItems]);
  };

  const deleteItems = async (itemIds: string[]) => {
    try {
      // API로 삭제 요청
      await Promise.all(
        itemIds.map(id => apiService.deleteLibraryItem(id))
      );
      
      // 로컬 상태에서 제거
      setItems((prevItems) => 
        prevItems.filter((item) => !itemIds.includes(item.id))
      );
    } catch (err) {
      console.error("삭제 실패:", err);
      // API 실패 시에도 로컬에서는 제거 (Mock 데이터 모드)
      setItems((prevItems) => 
        prevItems.filter((item) => !itemIds.includes(item.id))
      );
      throw err;
    }
  };

  const getItemsByType = (type: LibraryItemType): LibraryItem[] => {
    return items.filter((item) => item.type === type);
  };

  const getItemsByVisibility = (visibility: LibraryItemVisibility): LibraryItem[] => {
    return items.filter((item) => item.visibility === visibility);
  };

  const value: LibraryContextType = {
    items,
    loading,
    error,
    addItem,
    deleteItems,
    refreshItems,
    getItemsByType,
    getItemsByVisibility,
  };

  return (
    <LibraryContext.Provider value={value}>
      {children}
    </LibraryContext.Provider>
  );
};