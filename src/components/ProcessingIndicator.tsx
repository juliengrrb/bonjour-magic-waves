import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, FileText, Brain, CheckCircle, Clock } from 'lucide-react'

interface ProcessingIndicatorProps {
  imageUrl: string
  isProcessing: boolean
}

export const ProcessingIndicator = ({ imageUrl, isProcessing }: ProcessingIndicatorProps) => {
  const [currentStep, setCurrentStep] = useState(0)
  const [dots, setDots] = useState('')

  const steps = [
    { icon: FileText, label: 'Upload terminé', description: 'Fichier envoyé avec succès' },
    { icon: Brain, label: 'Analyse OCR', description: 'Extraction intelligente des données' },
    { icon: CheckCircle, label: 'Traitement', description: 'Structuration des informations' },
  ]

  useEffect(() => {
    if (!isProcessing) return

    const stepInterval = setInterval(() => {
      setCurrentStep(prev => (prev + 1) % steps.length)
    }, 2000)

    const dotsInterval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.')
    }, 500)

    return () => {
      clearInterval(stepInterval)
      clearInterval(dotsInterval)
    }
  }, [isProcessing, steps.length])

  if (!isProcessing) return null

  return (
    <Card className="border border-primary/20 bg-gradient-to-br from-primary/5 to-success/5 animate-fade-in-scale">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Loader2 className="h-6 w-6 text-primary animate-spin" />
            <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg text-foreground">
              Traitement en cours{dots}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Veuillez patienter pendant l'analyse de votre facture
            </p>
          </div>
          <Badge variant="secondary" className="animate-pulse">
            <Clock className="h-3 w-3 mr-1" />
            En cours
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {/* Preview Image */}
        <div className="aspect-[3/4] bg-muted rounded-lg mb-4 overflow-hidden max-w-48 mx-auto">
          <img 
            src={imageUrl} 
            alt="Facture en cours de traitement"
            className="w-full h-full object-cover opacity-75"
          />
        </div>

        {/* Processing Steps */}
        <div className="space-y-3">
          {steps.map((step, index) => {
            const Icon = step.icon
            const isActive = index === currentStep
            const isCompleted = index < currentStep
            
            return (
              <div 
                key={index}
                className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-500 ${
                  isActive 
                    ? 'bg-primary/10 border border-primary/20 scale-105' 
                    : isCompleted 
                      ? 'bg-success/10 border border-success/20'
                      : 'bg-muted/50 border border-border'
                }`}
              >
                <div className={`p-2 rounded-full ${
                  isActive 
                    ? 'bg-primary/20 text-primary' 
                    : isCompleted 
                      ? 'bg-success/20 text-success'
                      : 'bg-muted text-muted-foreground'
                }`}>
                  {isActive ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                </div>
                <div className="flex-1">
                  <p className={`font-medium text-sm ${
                    isActive ? 'text-primary' : isCompleted ? 'text-success' : 'text-muted-foreground'
                  }`}>
                    {step.label}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {step.description}
                  </p>
                </div>
                {isCompleted && (
                  <CheckCircle className="h-4 w-4 text-success" />
                )}
              </div>
            )
          })}
        </div>

        <div className="mt-4 p-3 bg-muted/30 rounded-lg">
          <p className="text-xs text-muted-foreground text-center">
            ⚡ Intelligence artificielle en action - Temps estimé: 30-60 secondes
          </p>
        </div>
      </CardContent>
    </Card>
  )
}