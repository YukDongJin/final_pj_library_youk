import { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LibraryItemCard } from "@/components/library/LibraryItemCard";
import { AddItemModal } from "@/components/library/AddItemModal";
import { DeleteConfirmModal } from "@/components/library/DeleteConfirmModal";
import { useLibrary } from "@/contexts/LibraryContext";
import { LibraryItemType } from "@/types/library";
import { ArrowLeft, Plus, Search, Grid, List, Trash2 } from "lucide-react";

const typeLabels: Record<LibraryItemType, string> = {
  image: "이미지",
  video: "비디오", 
  document: "문서",
  file: "파일",
};

const LibraryDetailPage = () => {
  const { type } = useParams<{ type: LibraryItemType }>();
  const { items, loading, error, addItem, deleteItems } = useLibrary();
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // 현재 타입의 아이템들 필터링
  const typeItems = useMemo(() => {
    if (!type) return [];
    return items.filter(item => item.type === type);
  }, [items, type]);

  // 검색 필터링
  const filteredItems = useMemo(() => {
    return typeItems.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [typeItems, searchTerm]);

  const handleSelectItem = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSelectAll = () => {
    if (selectedItems.length === filteredItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredItems.map(item => item.id));
    }
  };

  const handleDeleteSelected = async () => {
    try {
      await deleteItems(selectedItems);
      setSelectedItems([]);
      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error("삭제 실패:", error);
    }
  };

  if (!type || !typeLabels[type]) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">잘못된 페이지</h1>
            <Link to="/library">
              <Button>라이브러리로 돌아가기</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">아이템을 불러오는 중...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 헤더 */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <Link to="/library">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                뒤로가기
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{typeLabels[type]}</h1>
              <p className="text-gray-600 mt-1">
                총 {typeItems.length}개의 {typeLabels[type]} {error && "(Mock 데이터)"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {selectedItems.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setIsDeleteModalOpen(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                삭제 ({selectedItems.length})
              </Button>
            )}
            <Button onClick={() => setIsAddModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {typeLabels[type]} 추가
            </Button>
          </div>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800 text-sm">{error}</p>
          </div>
        )}

        {/* 검색 및 도구 */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={`${typeLabels[type]} 검색...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex items-center gap-2">
            {filteredItems.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
              >
                {selectedItems.length === filteredItems.length ? "전체 해제" : "전체 선택"}
              </Button>
            )}
            
            <div className="flex border rounded-lg">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="rounded-r-none"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="rounded-l-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* 선택된 아이템 정보 */}
        {selectedItems.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800 text-sm">
              {selectedItems.length}개의 아이템이 선택되었습니다.
            </p>
          </div>
        )}

        {/* 아이템 목록 */}
        {filteredItems.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="text-gray-400 mb-4">
                <div className="h-12 w-12 mx-auto bg-gray-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">📁</span>
                </div>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? "검색 결과가 없습니다" : `${typeLabels[type]}가 없습니다`}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm 
                  ? "다른 검색어를 시도해보세요" 
                  : `첫 번째 ${typeLabels[type]}를 추가해보세요`
                }
              </p>
              {!searchTerm && (
                <Button onClick={() => setIsAddModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  {typeLabels[type]} 추가
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className={
            viewMode === "grid" 
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              : "space-y-4"
          }>
            {filteredItems.map((item) => (
              <LibraryItemCard
                key={item.id}
                item={item}
                viewMode={viewMode}
                isSelected={selectedItems.includes(item.id)}
                onSelect={() => handleSelectItem(item.id)}
                showCheckbox={true}
              />
            ))}
          </div>
        )}

        {/* 모달들 */}
        <AddItemModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onAdd={addItem}
          defaultType={type}
        />

        <DeleteConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDeleteSelected}
          itemCount={selectedItems.length}
        />
      </div>
    </div>
  );
};

export default LibraryDetailPage;