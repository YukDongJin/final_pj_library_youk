import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { LibraryItem } from "@/types/library";
import { MoreVertical, Download, Edit, Trash2, Eye, Share, Image, Video, FileText, File } from "lucide-react";

interface LibraryItemCardProps {
  item: LibraryItem;
  viewMode?: "grid" | "list";
  isSelected?: boolean;
  onSelect?: () => void;
  showCheckbox?: boolean;
}

const typeIcons = {
  image: Image,
  video: Video,
  document: FileText,
  file: File,
};

const typeColors = {
  image: "bg-green-100 text-green-800",
  video: "bg-purple-100 text-purple-800", 
  document: "bg-blue-100 text-blue-800",
  file: "bg-gray-100 text-gray-800",
};

const formatFileSize = (bytes?: number): string => {
  if (!bytes) return "";
  
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + " " + sizes[i];
};

const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
};

export const LibraryItemCard: React.FC<LibraryItemCardProps> = ({
  item,
  viewMode = "grid",
  isSelected = false,
  onSelect,
  showCheckbox = false,
}) => {
  const [imageError, setImageError] = useState(false);
  const IconComponent = typeIcons[item.type];

  const handleDownload = () => {
    // 실제 다운로드 로직 구현 필요
    console.log("다운로드:", item.name);
  };

  const handleEdit = () => {
    // 편집 모달 열기 로직 구현 필요
    console.log("편집:", item.name);
  };

  const handleDelete = () => {
    // 삭제 확인 모달 열기 로직 구현 필요
    console.log("삭제:", item.name);
  };

  const handleShare = () => {
    // 공유 로직 구현 필요
    console.log("공유:", item.name);
  };

  const handlePreview = () => {
    // 미리보기 모달 열기 로직 구현 필요
    console.log("미리보기:", item.name);
  };

  if (viewMode === "list") {
    return (
      <Card className={`transition-all hover:shadow-md ${isSelected ? 'ring-2 ring-blue-500' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {/* 체크박스 */}
            {showCheckbox && (
              <Checkbox
                checked={isSelected}
                onCheckedChange={onSelect}
              />
            )}

            {/* 아이콘/썸네일 */}
            <div className="flex-shrink-0">
              {item.thumbnail && !imageError ? (
                <img
                  src={item.thumbnail}
                  alt={item.name}
                  className="w-12 h-12 object-cover rounded-lg"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  <IconComponent className="h-6 w-6 text-gray-600" />
                </div>
              )}
            </div>

            {/* 정보 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-medium text-gray-900 truncate">{item.name}</h3>
                <Badge variant="secondary" className={typeColors[item.type]}>
                  {item.type}
                </Badge>
                {item.visibility === "public" && (
                  <Badge variant="outline">공개</Badge>
                )}
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>{formatDate(item.createdAt)}</span>
                {item.size && <span>{formatFileSize(item.size)}</span>}
              </div>
            </div>

            {/* 액션 버튼 */}
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handlePreview}>
                <Eye className="h-4 w-4" />
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleDownload}>
                    <Download className="h-4 w-4 mr-2" />
                    다운로드
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleShare}>
                    <Share className="h-4 w-4 mr-2" />
                    공유
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleEdit}>
                    <Edit className="h-4 w-4 mr-2" />
                    편집
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                    <Trash2 className="h-4 w-4 mr-2" />
                    삭제
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Grid 모드
  return (
    <Card className={`group transition-all hover:shadow-lg ${isSelected ? 'ring-2 ring-blue-500' : ''}`}>
      <CardContent className="p-0">
        {/* 체크박스 (Grid 모드) */}
        {showCheckbox && (
          <div className="absolute top-2 left-2 z-10">
            <Checkbox
              checked={isSelected}
              onCheckedChange={onSelect}
              className="bg-white shadow-sm"
            />
          </div>
        )}

        {/* 썸네일/아이콘 영역 */}
        <div className="relative aspect-video bg-gray-100 rounded-t-lg overflow-hidden">
          {item.thumbnail && !imageError ? (
            <img
              src={item.thumbnail}
              alt={item.name}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <IconComponent className="h-12 w-12 text-gray-400" />
            </div>
          )}
          
          {/* 호버 시 액션 버튼들 */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={handlePreview}>
                <Eye className="h-4 w-4" />
              </Button>
              <Button variant="secondary" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* 정보 영역 */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-medium text-gray-900 truncate flex-1" title={item.name}>
              {item.name}
            </h3>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleShare}>
                  <Share className="h-4 w-4 mr-2" />
                  공유
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  편집
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                  <Trash2 className="h-4 w-4 mr-2" />
                  삭제
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className={typeColors[item.type]}>
                {item.type}
              </Badge>
              {item.visibility === "public" && (
                <Badge variant="outline" className="text-xs">
                  공개
                </Badge>
              )}
            </div>
          </div>

          <div className="mt-2 text-xs text-gray-500 space-y-1">
            <div>{formatDate(item.createdAt)}</div>
            {item.size && <div>{formatFileSize(item.size)}</div>}
          </div>

          {/* 미리보기 텍스트 */}
          {item.preview && (
            <p className="mt-2 text-sm text-gray-600 line-clamp-2">
              {item.preview}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};