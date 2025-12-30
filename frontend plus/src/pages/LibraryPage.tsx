import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { LibraryItemCard } from "@/components/library/LibraryItemCard";
import { AddItemModal } from "@/components/library/AddItemModal";
import { useLibrary } from "@/contexts/LibraryContext";
import { LibraryItemType } from "@/types/library";
import { Plus, Search, Image, Video, FileText, File, Filter, Grid, List } from "lucide-react";

const LibraryPage = () => {
  const { items, loading, error, addItem } = useLibrary();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<LibraryItemType | "all">("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalType, setAddModalType] = useState<LibraryItemType>("file");

  // 필터링된 아이템들
  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === "all" || item.type === selectedType;
    return matchesSearch && matchesType;
  });

  // 타입별 아이템 개수
  const getTypeCount = (type: LibraryItemType) => {
    return items.filter(item => item.type === type).length;
  };

  const handleAddClick = (type: LibraryItemType) => {
    setAddModalType(type);
    setIsAddModalOpen(true);
  };

  const typeConfig = [
    { type: "image" as LibraryItemType, label: "이미지", icon: Image, color: "bg-green-100 text-green-800" },
    { type: "video" as LibraryItemType, label: "비디오", icon: Video, color: "bg-purple-100 text-purple-800" },
    { type: "document" as LibraryItemType, label: "문서", icon: FileText, color: "bg-blue-100 text-blue-800" },
    { type: "file" as LibraryItemType, label: "파일", icon: File, color: "bg-gray-100 text-gray-800" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">라이브러리를 불러오는 중...</p>
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
          <div>
            <h1 className="text-3xl font-bold text-gray-900">라이브러리</h1>
            <p className="text-gray-600 mt-1">
              총 {items.length}개의 아이템 {error && "(Mock 데이터)"}
            </p>
          </div>

          {/* 추가 버튼 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                추가
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {typeConfig.map(({ type, label, icon: Icon }) => (
                <DropdownMenuItem
                  key={type}
                  onClick={() => handleAddClick(type)}
                  className="flex items-center gap-2"
                >
                  <Icon className="h-4 w-4" />
                  {label} 추가
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800 text-sm">{error}</p>
          </div>
        )}

        {/* 타입별 요약 카드 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {typeConfig.map(({ type, label, icon: Icon, color }) => (
            <Card 
              key={type}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedType === type ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => setSelectedType(selectedType === type ? "all" : type)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-gray-600" />
                    <span className="font-medium text-gray-900">{label}</span>
                  </div>
                  <Badge variant="secondary" className={color}>
                    {getTypeCount(type)}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 검색 및 필터 */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="아이템 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant={selectedType === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedType("all")}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              전체
            </Button>
            
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

        {/* 아이템 목록 */}
        {filteredItems.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="text-gray-400 mb-4">
                <File className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm || selectedType !== "all" ? "검색 결과가 없습니다" : "아이템이 없습니다"}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || selectedType !== "all" 
                  ? "다른 검색어나 필터를 시도해보세요" 
                  : "첫 번째 아이템을 추가해보세요"
                }
              </p>
              {!searchTerm && selectedType === "all" && (
                <Button onClick={() => handleAddClick("file")}>
                  <Plus className="h-4 w-4 mr-2" />
                  아이템 추가
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
              />
            ))}
          </div>
        )}

        {/* 추가 모달 */}
        <AddItemModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onAdd={addItem}
          defaultType={addModalType}
        />
      </div>
    </div>
  );
};

export default LibraryPage;