import React, { useState, useRef, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, 
  Focus, 
  Eraser, 
  Download, 
  Image as ImageIcon, 
  X, 
  Loader2, 
  CheckCircle2, 
  ArrowRight,
  Maximize2,
  Trash2,
  Info
} from 'lucide-react';
import { cn } from './lib/utils';
import { removeBackground } from '@imgly/background-removal';

// --- Components ---

interface BeforeAfterSliderProps {
  before: string;
  after: string;
  isProcessing: boolean;
}

const BeforeAfterSlider = ({ before, after, isProcessing }: BeforeAfterSliderProps) => {
  const [sliderPos, setSliderPos] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!containerRef.current || isProcessing) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = 'touches' in e ? (e as React.TouchEvent).touches[0].clientX : (e as React.MouseEvent).clientX;
    const pos = ((x - rect.left) / rect.width) * 100;
    setSliderPos(Math.min(Math.max(pos, 0), 100));
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full aspect-video rounded-xl overflow-hidden cursor-ew-resize select-none border border-zinc-800 bg-zinc-950 group"
      onMouseMove={handleMove}
      onTouchMove={handleMove}
    >
      {/* After image (the processsed one) */}
      <img src={after} alt="After" className="absolute inset-0 w-full h-full object-contain" />
      
      {/* Before image (clipped) */}
      <div 
        className="absolute inset-0 w-full h-full overflow-hidden" 
        style={{ width: `${sliderPos}%` }}
      >
        <img src={before} alt="Before" className="absolute inset-0 w-full h-full object-contain max-w-none" style={{ width: '100%' }} />
      </div>

      {/* Slider middle bar */}
      <div 
        className="absolute inset-y-0 bg-white w-1 shadow-xl pointer-events-none"
        style={{ left: `${sliderPos}%` }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full flex items-center justify-center border-4 border-zinc-900 shadow-xl">
          <ArrowRight className="w-4 h-4 text-zinc-900" />
        </div>
      </div>

      {/* Labels */}
      <div className="absolute top-4 left-4 px-2 py-1 bg-black/50 backdrop-blur-md rounded border border-white/10 text-[10px] uppercase tracking-widest text-white/70 pointer-events-none group-hover:opacity-100 opacity-0 transition-opacity">
        Original
      </div>
      <div className="absolute top-4 right-4 px-2 py-1 bg-white/10 backdrop-blur-md rounded border border-white/20 text-[10px] uppercase tracking-widest text-white pointer-events-none group-hover:opacity-100 opacity-0 transition-opacity">
        Enhanced
      </div>
      
      {isProcessing && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-8 h-8 text-white animate-spin" />
          <p className="text-white text-sm font-medium animate-pulse">Running AI Magic...</p>
        </div>
      )}
    </div>
  );
};

export default function App() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'enhance' | 'bg-remove' | 'none'>('none');
  const [progress, setProgress] = useState(0);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = () => {
      setOriginalImage(reader.result as string);
      setProcessedImage(null);
      setActiveTab('none');
    };
    reader.readAsDataURL(file);
  }, []);

  // @ts-ignore
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    multiple: false
  });

  const handleEnhance = async () => {
    if (!originalImage) return;
    setIsProcessing(true);
    setActiveTab('enhance');
    setProgress(10);

    try {
      const img = new Image();
      img.src = originalImage;
      await new Promise((resolve) => (img.onload = resolve));

      // Simulate step-by-step progress
      setProgress(30);
      
      const canvas = document.createElement('canvas');
      const targetWidth = 3840; // 4K Width
      const ratio = targetWidth / img.width;
      canvas.width = targetWidth;
      canvas.height = img.height * ratio;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      // High quality upscaling
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      setProgress(60);

      // --- ADVANCED SHARPENING (De-blur) ---
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const width = imageData.width;
      const height = imageData.height;

      // Simple Sharpening Kernel (Convolution)
      // |  0 -1  0 |
      // | -1  5 -1 |
      // |  0 -1  0 |
      const kernel = [
        0, -1, 0,
        -1, 5, -1,
        0, -1, 0
      ];
      const side = Math.round(Math.sqrt(kernel.length));
      const halfSide = Math.floor(side / 2);
      const output = ctx.createImageData(width, height);
      const outData = output.data;

      // Apply sharpening convolution
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const dstOff = (y * width + x) * 4;
          let r = 0, g = 0, b = 0;
          
          for (let cy = 0; cy < side; cy++) {
            for (let cx = 0; cx < side; cx++) {
              const scy = y + cy - halfSide;
              const scx = x + cx - halfSide;
              
              if (scy >= 0 && scy < height && scx >= 0 && scx < width) {
                const srcOff = (scy * width + scx) * 4;
                const wt = kernel[cy * side + cx];
                r += data[srcOff] * wt;
                g += data[srcOff + 1] * wt;
                b += data[srcOff + 2] * wt;
              }
            }
          }
          
          outData[dstOff] = Math.min(255, Math.max(0, r));
          outData[dstOff + 1] = Math.min(255, Math.max(0, g));
          outData[dstOff + 2] = Math.min(255, Math.max(0, b));
          outData[dstOff + 3] = data[dstOff + 3]; // alpha
        }
      }
      ctx.putImageData(output, 0, 0);

      setProgress(80);

      // Final post-processing filters
      if ('filter' in ctx) {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        if (tempCtx) {
          tempCtx.filter = 'contrast(1.08) saturate(1.15) brightness(1.02) sharpness(2)';
          tempCtx.drawImage(canvas, 0, 0);
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(tempCanvas, 0, 0);
        }
      }

      setProgress(95);
      setProcessedImage(canvas.toDataURL('image/png', 0.98));
      setProgress(100);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveBG = async () => {
    if (!originalImage) return;
    setIsProcessing(true);
    setActiveTab('bg-remove');
    setProgress(0);

    try {
      // Create a Blob from base64
      const response = await fetch(originalImage);
      const blob = await response.blob();
      
      // Load and process
      const resultBlob = await removeBackground(blob, {
        progress: (step, curr, total) => {
          // step will be something like 'fetch-model' etc
          // we simplify the progress for the user
          const p = Math.round((curr / total) * 100);
          if (!isNaN(p)) setProgress(p);
        }
      });
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setProcessedImage(reader.result as string);
        setIsProcessing(false);
        setProgress(100);
      };
      reader.readAsDataURL(resultBlob);
    } catch (err) {
      console.error(err);
      setIsProcessing(false);
    }
  };

  const downloadImage = () => {
    if (!processedImage) return;
    const link = document.createElement('a');
    link.href = processedImage;
    link.download = `ai-clarity-${activeTab}-${Date.now()}.png`;
    link.click();
  };

  const reset = () => {
    setOriginalImage(null);
    setProcessedImage(null);
    setActiveTab('none');
    setProgress(0);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans selection:bg-white selection:text-black">
      {/* Background Decorative Element */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-white/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-white/5 blur-[100px] rounded-full" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 group cursor-default">
            <div className="w-8 h-8 bg-white rounded flex items-center justify-center transition-transform group-hover:rotate-12">
              <Focus className="w-5 h-5 text-black" />
            </div>
            <h1 className="text-lg font-bold tracking-tighter uppercase italic">
              Pix <span className="text-zinc-500 font-normal">AI</span>
            </h1>
          </div>
          <div className="flex items-center gap-4">
            {/* Removed Documentation and System Ready */}
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto p-6 md:p-12">
        <AnimatePresence mode="wait">
          {!originalImage ? (
            <motion.div 
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-xl mx-auto pt-12 text-center"
            >
              <h2 className="text-4xl md:text-5xl font-light tracking-tight mb-4 text-white">
                Crystal clear <span className="italic font-serif">precision</span>
              </h2>
              <p className="text-zinc-500 mb-10 text-sm md:text-base leading-relaxed text-balance">
                Upscale images to 4K and remove blur with Pix AI neural sharpening. 
                Keep every detail sharp, clean, and professional.
              </p>

              <div 
                {...getRootProps()} 
                className={cn(
                  "relative group cursor-pointer aspect-square max-w-[400px] mx-auto rounded-3xl border-2 border-dashed transition-all duration-300",
                  isDragActive ? "border-white bg-white/5" : "border-zinc-800 hover:border-zinc-500 bg-zinc-900/50"
                )}
              >
                <input {...getInputProps()} />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-zinc-400 group-hover:text-white transition-colors">
                  <div className="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <Upload className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="font-medium text-lg">Drop your image here</p>
                    <p className="text-xs uppercase tracking-widest mt-1 opacity-60">PNG, JPG, WebP supported</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-12 flex flex-wrap justify-center gap-8 opacity-40">
                <div className="flex items-center gap-2">
                  <Maximize2 className="w-4 h-4" />
                  <span className="text-[10px] uppercase tracking-widest">4K Upscaling</span>
                </div>
                <div className="flex items-center gap-2">
                  <Eraser className="w-4 h-4" />
                  <span className="text-[10px] uppercase tracking-widest">Background Removal</span>
                </div>
                <div className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  <span className="text-[10px] uppercase tracking-widest">Fast Download</span>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="editor"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-12"
            >
              <div className="lg:col-span-8 flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={reset}
                      className="p-2 hover:bg-zinc-900 rounded-lg transition-colors border border-transparent hover:border-zinc-800"
                    >
                      <X className="w-5 h-5 text-zinc-400" />
                    </button>
                    <h2 className="text-sm uppercase tracking-widest font-medium">Editor Workspace</h2>
                  </div>
                  {processedImage && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 text-green-500 rounded-full border border-green-500/20">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span className="text-[10px] uppercase font-bold tracking-tighter">Process Complete</span>
                    </div>
                  )}
                </div>

                {processedImage ? (
                  <BeforeAfterSlider before={originalImage} after={processedImage} isProcessing={isProcessing} />
                ) : (
                  <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 flex items-center justify-center">
                    <img src={originalImage} alt="Original" className="w-full h-full object-contain opacity-50 grayscale" />
                    <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-4">
                      <ImageIcon className="w-12 h-12 text-zinc-700" />
                      <p className="text-zinc-500 text-sm italic">Ready for processing</p>
                    </div>
                  </div>
                )}

                <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 flex items-start gap-4">
                  <div className="p-2 bg-zinc-800 rounded-lg">
                    <Info className="w-4 h-4 text-zinc-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-zinc-400 leading-relaxed uppercase tracking-tight">
                      Use the slider to compare results. Enhancement uses bicubic upscaling and sharpening layers for 4K resolution output. Background removal uses neural segmentation.
                    </p>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-4 flex flex-col gap-6">
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold">Workbench Actions</p>
                  <h3 className="text-xl font-medium tracking-tight">AI Tools</h3>
                </div>

                <div className="flex flex-col gap-3">
                  <button 
                    onClick={handleEnhance}
                    disabled={isProcessing}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-xl transition-all group border",
                      activeTab === 'enhance' ? "bg-white text-black border-white" : "bg-zinc-900 text-white border-zinc-800 hover:border-zinc-600",
                      isProcessing && activeTab !== 'enhance' && "opacity-50 grayscale"
                    )}
                  >
                    <div className="flex items-center gap-4 text-left">
                      <div className={cn("p-2 rounded-lg transition-colors", activeTab === 'enhance' ? "bg-black text-white" : "bg-zinc-800")}>
                        <Focus className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-bold text-sm uppercase tracking-tight">Sharpen to 4K</p>
                        <p className={cn("text-[10px] uppercase tracking-widest", activeTab === 'enhance' ? "text-black/60" : "text-zinc-500")}>Clean Blur & Upscale</p>
                      </div>
                    </div>
                    {activeTab === 'enhance' && !isProcessing && <CheckCircle2 className="w-5 h-5 text-black" />}
                    {activeTab === 'enhance' && isProcessing && <Loader2 className="w-5 h-5 text-black animate-spin" />}
                  </button>

                  <button 
                    onClick={handleRemoveBG}
                    disabled={isProcessing}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-xl transition-all group border",
                      activeTab === 'bg-remove' ? "bg-white text-black border-white" : "bg-zinc-900 text-white border-zinc-800 hover:border-zinc-600",
                      isProcessing && activeTab !== 'bg-remove' && "opacity-50 grayscale"
                    )}
                  >
                    <div className="flex items-center gap-4 text-left">
                      <div className={cn("p-2 rounded-lg transition-colors", activeTab === 'bg-remove' ? "bg-black text-white" : "bg-zinc-800")}>
                        <Eraser className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-bold text-sm uppercase tracking-tight">Remove Background</p>
                        <p className={cn("text-[10px] uppercase tracking-widest", activeTab === 'bg-remove' ? "text-black/60" : "text-zinc-500")}>Neural Segmenting</p>
                      </div>
                    </div>
                    {activeTab === 'bg-remove' && !isProcessing && <CheckCircle2 className="w-5 h-5 text-black" />}
                    {activeTab === 'bg-remove' && isProcessing && <Loader2 className="w-5 h-5 text-black animate-spin" />}
                  </button>
                </div>

                {isProcessing && (
                  <div className="space-y-4 py-4 animate-in fade-in slide-in-from-bottom-4">
                    <div className="flex items-center justify-between text-[10px] uppercase tracking-widest font-bold text-zinc-500">
                      <span>Neural Processing</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="h-1 bg-zinc-900 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-white"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="mt-auto pt-8 border-t border-zinc-900 flex flex-col gap-3">
                  <button 
                    onClick={downloadImage}
                    disabled={!processedImage || isProcessing}
                    className="w-full flex items-center justify-center gap-3 p-4 bg-zinc-100 text-black rounded-xl font-bold uppercase text-xs tracking-widest hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Download className="w-4 h-4" />
                    Download Result
                  </button>
                  <button 
                    onClick={reset}
                    className="w-full p-4 text-zinc-500 hover:text-zinc-300 transition-colors uppercase text-[10px] tracking-widest font-bold flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Discard Image
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
