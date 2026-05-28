"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import { AuthenticatedImage } from "@/components/media/authenticated-image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FileImage, Plus, Trash2 } from "lucide-react";
import type { MediaFile, PaginatedResponse, ApiResponse } from "@/lib/types";

export default function FilesPage() {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [entityType, setEntityType] = useState("");
  const [entityId, setEntityId] = useState("");

  const fetchFiles = async (page = 1) => {
    setLoading(true);
    try {
      const res = await apiFetch<PaginatedResponse<MediaFile>>(`/files?page=${page}&limit=20`);
      setFiles(res.data ?? []);
      setMeta(res.meta ?? meta);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load files");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    async function loadInitialFiles() {
      setLoading(true);
      try {
        const res = await apiFetch<PaginatedResponse<MediaFile>>(`/files?page=1&limit=20`);
        if (!cancelled) {
          setFiles(res.data ?? []);
          setMeta(res.meta ?? { total: 0, page: 1, limit: 20, totalPages: 1 });
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load files");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadInitialFiles();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (entityType) formData.append("entityType", entityType);
      if (entityId) formData.append("entityId", entityId);
      await apiFetch<ApiResponse<MediaFile>>("/files/upload", {
        method: "POST",
        body: formData,
      });
      setFile(null);
      setEntityType("");
      setEntityId("");
      fetchFiles(meta.page);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this file?")) return;
    try {
      await apiFetch<ApiResponse<unknown>>(`/files/${id}`, { method: "DELETE" });
      fetchFiles(meta.page);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete file");
    }
  };

  const isImage = (mime: string) => mime.startsWith("image/");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Files</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upload File</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpload} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="space-y-2">
              <Label>File</Label>
              <Input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} required />
            </div>
            <div className="space-y-2">
              <Label>Entity Type (optional)</Label>
              <Input value={entityType} onChange={(e) => setEntityType(e.target.value)} placeholder="e.g. vehicle" />
            </div>
            <div className="space-y-2">
              <Label>Entity ID (optional)</Label>
              <Input value={entityId} onChange={(e) => setEntityId(e.target.value)} />
            </div>
            <Button type="submit" disabled={uploading || !file}>
              <Plus className="w-4 h-4 mr-2" />
              {uploading ? "Uploading..." : "Upload"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {loading && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      )}

      {error && <p className="text-destructive text-sm">{error}</p>}

      {!loading && files.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <FileImage className="w-10 h-10 mb-3 opacity-50" />
          <p>No files uploaded yet.</p>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {files.map((f) => (
          <Card key={f.id} className="overflow-hidden">
            <div className="aspect-square bg-muted relative">
              {isImage(f.mimeType) ? (
                <AuthenticatedImage
                  fileId={f.id}
                  alt={f.filename}
                  width={320}
                  height={320}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <FileImage className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
            </div>
            <CardContent className="p-3">
              <p className="text-xs truncate font-medium" title={f.filename}>{f.filename}</p>
              <p className="text-[10px] text-muted-foreground">{(f.size / 1024).toFixed(1)} KB</p>
              <Button variant="ghost" size="sm" className="mt-2 h-8 w-full" onClick={() => handleDelete(f.id)}>
                <Trash2 className="w-3 h-3 mr-1 text-destructive" />
                Delete
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {meta.totalPages > 1 && (
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={meta.page <= 1} onClick={() => fetchFiles(meta.page - 1)}>
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">Page {meta.page} of {meta.totalPages}</span>
          <Button variant="outline" size="sm" disabled={meta.page >= meta.totalPages} onClick={() => fetchFiles(meta.page + 1)}>
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
