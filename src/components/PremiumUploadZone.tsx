import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileImage, CheckCircle, AlertCircle, Loader2, Sparkles, FileText, Database, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  preview?: string;
  imageUrl?: string;
}

interface PremiumUploadZoneProps {
  onUploadComplete?: (invoiceId: string) => void;
  onUploadStart?: (imageUrl: string) => void;
}

const processingSteps = [
  { icon: Upload, label: "Upload en cours...", status: "uploading" },
  { icon: FileText, label: "Extraction des données...", status: "processing" },
  { icon: Zap, label: "Analyse par IA...", status: "processing" },
  { icon: Database, label: "Sauvegarde...", status: "processing" },
  { icon: CheckCircle, label: "Traitement terminé !", status: "completed" }
];

export const PremiumUploadZone = ({ onUploadComplete, onUploadStart }: PremiumUploadZoneProps) => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const sendToWebhook = async (file: File, fileId: string): Promise<void> => {
    if (!user) throw new Error("User not authenticated");
    
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

    const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL!;
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookData),
    });

    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.status}`);
    }
  };

  const simulateProgress = (fileId: string) => {
    const updateProgress = (progress: number, step: number) => {
      setFiles(prev => prev.map(f => 
        f.id === fileId 
          ? { ...f, progress } 
          : f
      ));
      setCurrentStep(step);
    };

    // Upload simulation
    setTimeout(() => updateProgress(25, 1), 500);
    setTimeout(() => updateProgress(50, 2), 1200);
    setTimeout(() => updateProgress(75, 3), 2000);
    setTimeout(() => updateProgress(100, 4), 3000);
  };


  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!user) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour uploader des fichiers",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    setCurrentStep(0);

    for (const file of acceptedFiles) {
      const fileId = `${Date.now()}-${Math.random().toString(36).substring(2)}`;
      const newFile: UploadedFile = {
        id: fileId,
        name: file.name,
        size: file.size,
        type: file.type,
        status: 'uploading',
        progress: 0,
        preview: URL.createObjectURL(file)
      };

      setFiles(prev => [...prev, newFile]);
      simulateProgress(fileId);

      try {
        setFiles(prev => prev.map(f => 
          f.id === fileId 
            ? { ...f, status: 'processing' } 
            : f
        ));

        await sendToWebhook(file, fileId);
        
        setFiles(prev => prev.map(f => 
          f.id === fileId 
            ? { ...f, status: 'completed' } 
            : f
        ));

        toast({
          title: "🎉 Upload réussi !",
          description: "Votre facture a été envoyée pour traitement",
        });

        // Auto-open invoice details after processing
        setTimeout(() => {
          if (onUploadComplete) {
            onUploadComplete(fileId);
          }
        }, 1500);

      } catch (error) {
        console.error('Upload error:', error);
        setFiles(prev => prev.map(f => 
          f.id === fileId 
            ? { ...f, status: 'error' } 
            : f
        ));
        
        toast({
          title: "Erreur d'envoi",
          description: "Impossible d'envoyer le fichier au service de traitement",
          variant: "destructive"
        });
      }
    }

    setIsProcessing(false);
  }, [user, toast, onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
      'application/pdf': ['.pdf']
    },
    multiple: true
  });

  const clearFiles = () => {
    setFiles([]);
    setCurrentStep(0);
  };

  return (
    <div className="space-y-8">
      {/* Ultra Premium Upload Zone */}
      <div
        {...getRootProps()}
        className={`upload-zone-premium group ${isDragActive ? 'dragover' : ''}`}
      >
        <input {...getInputProps()} />
        
        <div className="space-y-6">
          <div className="relative">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full border-2 border-primary/30 flex items-center justify-center bg-primary/10 animate-float-bounce">
              <Sparkles className="h-10 w-10 text-primary" />
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">
              {isDragActive ? "Déposez vos fichiers ici" : "Zone d'Upload Premium"}
            </h3>
            <p className="text-muted-foreground text-lg">
              Glissez-déposez vos factures ou cliquez pour sélectionner
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            <Badge variant="outline" className="border-primary/30 text-primary">
              <FileImage className="w-3 h-3 mr-1" />
              Images
            </Badge>
            <Badge variant="outline" className="border-success/30 text-success">
              <FileText className="w-3 h-3 mr-1" />
              PDF
            </Badge>
          </div>

          <Button 
            variant="outline" 
            size="lg"
            className="border-primary/30 hover:border-primary hover:bg-primary/10 transition-all duration-300"
          >
            <Upload className="mr-2 h-5 w-5" />
            Sélectionner les fichiers
          </Button>
        </div>
      </div>

      {/* Processing Animation */}
      {isProcessing && (
        <Card className="chart-container-premium">
          <CardContent className="p-8">
            <div className="space-y-6">
              <h4 className="text-xl font-semibold text-center">Traitement en cours...</h4>
              
              <div className="space-y-4">
                {processingSteps.map((step, index) => {
                  const Icon = step.icon;
                  const isActive = index === currentStep;
                  const isCompleted = index < currentStep;
                  
                  return (
                    <div 
                      key={index}
                      className={`upload-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 
                        ${isCompleted ? 'border-success bg-success/20' : isActive ? 'border-primary bg-primary/20' : 'border-muted'}`}>
                        {isCompleted ? (
                          <CheckCircle className="w-4 h-4 text-success" />
                        ) : isActive ? (
                          <Loader2 className="w-4 h-4 text-primary animate-spin" />
                        ) : (
                          <Icon className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                      <span className={`text-sm font-medium
                        ${isCompleted ? 'text-success' : isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Files List */}
      {files.length > 0 && (
        <Card className="chart-container-premium">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold">Fichiers uploadés</h4>
              <Button variant="outline" size="sm" onClick={clearFiles}>
                Effacer tout
              </Button>
            </div>
            
            <div className="space-y-3">
              {files.map((file) => (
                <div key={file.id} className="invoice-card-premium p-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      {file.type.startsWith('image/') ? (
                        <FileImage className="w-6 h-6 text-primary" />
                      ) : (
                        <FileText className="w-6 h-6 text-primary" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h5 className="font-medium truncate">{file.name}</h5>
                      <p className="text-sm text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      
                      {file.status === 'uploading' && (
                        <div className="mt-2">
                          <Progress value={file.progress} className="h-2" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center">
                      {file.status === 'completed' && (
                        <CheckCircle className="w-5 h-5 text-success" />
                      )}
                      {file.status === 'error' && (
                        <AlertCircle className="w-5 h-5 text-destructive" />
                      )}
                      {file.status === 'processing' && (
                        <Loader2 className="w-5 h-5 text-primary animate-spin" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
