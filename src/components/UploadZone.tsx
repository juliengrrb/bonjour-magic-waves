import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Upload, FileText, Image, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  status: 'uploading' | 'success' | 'error';
  progress: number;
  preview?: string;
  imageUrl?: string;
}

const WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL!;

export const UploadZone = () => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();

  const sendToWebhook = async (fileId: string, file: File) => {
    if (!user) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour uploader des fichiers",
        variant: "destructive",
      });
      return;
    }

    try {
      // Upload file to Supabase Storage first
      const fileName = `${user.id}/${Date.now()}-${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('invoices')
        .upload(fileName, file);

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('invoices')
        .getPublicUrl(fileName);

      // Send JSON to webhook
      const webhookData = {
        user_id: user.id,
        image_url: publicUrl,
        timestamp: new Date().toISOString(),
      };

      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookData),
      });

      if (!response.ok) {
        throw new Error(`Webhook failed: ${response.status}`);
      }

      // Update file status to success
      setUploadedFiles(prev =>
        prev.map(f => 
          f.id === fileId 
            ? { ...f, status: 'success' as const, progress: 100 }
            : f
        )
      );

      toast({
        title: "Fichier envoyé avec succès",
        description: "Votre facture est en cours de traitement automatique.",
      });

    } catch (error) {
      console.error('Upload error:', error);
      setUploadedFiles(prev =>
        prev.map(f => 
          f.id === fileId 
            ? { ...f, status: 'error' as const }
            : f
        )
      );
      
      toast({
        title: "Erreur d'upload",
        description: "Impossible d'envoyer le fichier. Veuillez réessayer.",
        variant: "destructive",
      });
    }
  };

  const simulateProgress = async (fileId: string) => {
    // Simulate upload progress
    for (let progress = 0; progress <= 90; progress += 15) {
      await new Promise(resolve => setTimeout(resolve, 200));
      setUploadedFiles(prev => 
        prev.map(f => f.id === fileId ? { ...f, progress } : f)
      );
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (!user) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour uploader des fichiers",
        variant: "destructive",
      });
      return;
    }

    acceptedFiles.forEach((file) => {
      const fileId = Math.random().toString(36).substr(2, 9);
      const reader = new FileReader();

      reader.onload = () => {
        const newFile: UploadedFile = {
          id: fileId,
          name: file.name,
          size: file.size,
          type: file.type,
          status: 'uploading',
          progress: 0,
          preview: reader.result as string
        };

        setUploadedFiles(prev => [...prev, newFile]);
        
        // Start progress simulation
        simulateProgress(fileId);
        // Send directly to webhook
        sendToWebhook(fileId, file);

        toast({
          title: "Upload en cours",
          description: `${file.name} est en cours d'upload...`,
        });
      };

      reader.readAsDataURL(file);
    });
  }, [toast, user]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
      'application/pdf': ['.pdf']
    },
    multiple: true
  });

  const clearFiles = () => {
    setUploadedFiles([]);
    toast({
      title: "Fichiers supprimés",
      description: "Tous les fichiers ont été retirés de la liste.",
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Upload Zone */}
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Zone de Téléchargement
          </CardTitle>
          <CardDescription>
            Glissez-déposez vos factures (images ou PDF) ou cliquez pour sélectionner
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`upload-zone cursor-pointer ${isDragActive ? 'dragover' : ''}`}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="p-4 rounded-full bg-primary/10">
                <Upload className="h-8 w-8 text-primary" />
              </div>
              <div className="text-center space-y-2">
                <p className="text-lg font-medium">
                  {isDragActive
                    ? "Déposez vos fichiers ici..."
                    : "Téléchargez vos factures"}
                </p>
                <p className="text-sm text-muted-foreground">
                  Formats supportés: PNG, JPG, JPEG, PDF
                </p>
              </div>
              <Button variant="outline" size="lg" className="pointer-events-none">
                Choisir les fichiers
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Fichiers Téléchargés</CardTitle>
              <CardDescription>
                {uploadedFiles.length} fichier(s) en cours de traitement
              </CardDescription>
            </div>
            <Button variant="outline" onClick={clearFiles} size="sm">
              Vider la liste
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {uploadedFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center space-x-4 p-4 rounded-lg border border-border bg-card/50"
                >
                  {/* File Icon */}
                  <div className="flex-shrink-0">
                    {file.type.startsWith('image/') ? (
                      <div className="w-12 h-12 rounded-lg overflow-hidden border border-border">
                        <img
                          src={file.preview}
                          alt={file.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-destructive/10 flex items-center justify-center">
                        <FileText className="h-6 w-6 text-destructive" />
                      </div>
                    )}
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>

                  {/* Progress */}
                  <div className="flex-1 max-w-xs">
                    {file.status === 'uploading' && (
                      <div className="space-y-2">
                        <Progress value={file.progress} className="h-2" />
                        <p className="text-xs text-muted-foreground">
                          {file.progress.toFixed(0)}% téléchargé
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Status Icon */}
                  <div className="flex-shrink-0">
                    {file.status === 'uploading' && (
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    )}
                    {file.status === 'success' && (
                      <CheckCircle className="h-5 w-5 text-success" />
                    )}
                    {file.status === 'error' && (
                      <AlertCircle className="h-5 w-5 text-destructive" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      <Card className="bg-gradient-to-r from-primary/5 to-success/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-4">
            <div className="p-2 rounded-full bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-1">
              <p className="font-medium">Traitement Automatique</p>
              <p className="text-sm text-muted-foreground">
                Vos factures sont automatiquement stockées dans Supabase et envoyées au webhook n8n pour extraction des données.
                Les informations extraites seront visibles dans l'onglet "Factures" en temps réel.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
