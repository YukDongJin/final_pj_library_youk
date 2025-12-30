import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { LibraryItemType, LibraryItemVisibility, LibraryItem } from "@/types/library";
import { apiService } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, Image, Video, File as FileIcon } from "lucide-react";

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (item: LibraryItem) => void;
  defaultType?: LibraryItemType;
}

const typeIcons = {
  image: Image,
  video: Video,
  document: FileText,
  file: FileIcon,
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export const AddItemModal: React.FC<AddItemModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  defaultType = "file",
}) => {
  const [name, setName] = useState("");
  const [visibility, setVisibility] = useState<LibraryItemVisibility>("private");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!name) {
        setName(file.name);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      toast({
        title: "파일을 선택해주세요",
        description: "업로드할 파일을 먼저 선택해주세요.",
        variant: "destructive",
      });
      return;
    }

    if (!name.trim()) {
      toast({
        title: "이름을 입력해주세요",
        description: "아이템 이름을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const uploadedItem = await apiService.uploadFile(
        selectedFile,
        name.trim(),
        visibility,
        (progress) => {
          setUploadProgress(progress);
        }
      );

      toast({
        title: "업로드 완료!",
        description: `${name}이(가) 성공적으로 업로드되었습니다.`,
      });

      onAdd(uploadedItem);
      handleClose();
    } catch (error) {
      console.error("업로드 실패:", error);
      toast({
        title: "업로드 실패",
        description: error instanceof Error ? error.message : "파일 업로드 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleClose = () => {
    if (!uploading) {
      setName("");
      setVisibility("private");
      setSelectedFile(null);
      setUploadProgress(0);
      onClose();
    }
  };

  const getFileTypeFromFile = (file: File): LibraryItemType => {
    return apiService.getFileType(file);
  };

  const fileType = selectedFile ? getFileTypeFromFile(selectedFile) : defaultType;
  const IconComponent = typeIcons[fileType];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconComponent className="h-5 w-5" />
            새 아이템 추가
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 파일 선택 */}
          <div className="space-y-2">
            <Label htmlFor="file">파일 선택</Label>
            <div className="flex items-center gap-2">
              <Input
                id="file"
                type="file"
                onChange={handleFileSelect}
                disabled={uploading}
                className="flex-1"
              />
              <Upload className="h-4 w-4 text-muted-foreground" />
            </div>
            {selectedFile && (
              <div className="text-sm text-muted-foreground">
                <p>파일: {selectedFile.name}</p>
                <p>크기: {formatFileSize(selectedFile.size)}</p>
                <p>타입: {fileType}</p>
              </div>
            )}
          </div>

          {/* 아이템 이름 */}
          <div className="space-y-2">
            <Label htmlFor="name">이름</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="아이템 이름을 입력하세요"
              disabled={uploading}
            />
          </div>

          {/* 공개 범위 */}
          <div className="space-y-2">
            <Label htmlFor="visibility">공개 범위</Label>
            <Select
              value={visibility}
              onValueChange={(value: LibraryItemVisibility) => setVisibility(value)}
              disabled={uploading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="private">비공개</SelectItem>
                <SelectItem value="public">공개</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 업로드 진행률 */}
          {uploading && (
            <div className="space-y-2">
              <Label>업로드 진행률</Label>
              <Progress value={uploadProgress} className="w-full" />
              <p className="text-sm text-muted-foreground text-center">
                {Math.round(uploadProgress)}% 완료
              </p>
            </div>
          )}

          {/* 버튼들 */}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={uploading}
            >
              취소
            </Button>
            <Button type="submit" disabled={uploading || !selectedFile}>
              {uploading ? "업로드 중..." : "추가"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};