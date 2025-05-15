import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { cn } from '@/lib/utils';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, Scan, Upload } from 'lucide-react';
import { toast } from 'sonner';

import CopyButton from './CopyButton';

interface ScannedItem {
  barcode: string;
  fileName: string;
}

export function Scanner() {
  const [scannedItem, setScannedItem] = useState<ScannedItem | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  const initializeScanner = () => {
    if (!scannerRef.current && scannerContainerRef.current) {
      try {
        scannerRef.current = new Html5Qrcode(scannerContainerRef.current.id);
      } catch (error) {
        console.error('Failed to initialize scanner:', error);
        toast.error('Failed to initialize barcode scanner');
      }
    }
  };

  // cleanup scanner when component unmounts
  useEffect(() => {
    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch((error) => {
          console.error('Failed to stop scanner:', error);
        });
      }
    };
  }, []);

  const triggerFileInput = () => {
    initializeScanner();
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const startCameraScanner = async () => {
    setIsProcessing(true);
    setIsCameraActive(true);

    // make scanner container visible
    if (scannerContainerRef.current) {
      scannerContainerRef.current.style.display = 'block';
      scannerContainerRef.current.style.width = '100%';
      scannerContainerRef.current.style.height = '100%';
    }

    try {
      initializeScanner();

      if (!scannerRef.current) {
        throw new Error('Scanner not initialized');
      }

      await scannerRef.current.start(
        { facingMode: 'environment' },

        {
          fps: 10,
          qrbox: { width: 280, height: 280 },
          aspectRatio: 1.0,
        },

        (decodedText) => {
          handleSuccessfulScan(decodedText, 'Camera capture');
          stopCameraScanner();
        },

        (errorMessage) => {
          console.log('QR scan error:', errorMessage);
        },
      );
    } catch (error) {
      console.error('Failed to start camera scanner:', error);
      toast.error(
        'Failed to start camera. Please try uploading an image instead.',
      );
      stopCameraScanner();
    }
  };

  const stopCameraScanner = () => {
    setIsProcessing(false);
    setIsCameraActive(false);

    if (scannerRef.current && scannerRef.current.isScanning) {
      scannerRef.current
        .stop()
        .then(() => {
          if (scannerContainerRef.current) {
            scannerContainerRef.current.style.display = 'none';
          }
        })
        .catch((err) => {
          console.error('Failed to stop scanner:', err);
        });
    } else {
      // hide scanner container if scanner wasn't running
      if (scannerContainerRef.current) {
        scannerContainerRef.current.style.display = 'none';
      }
    }
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsProcessing(true);

    // process each selected file
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image file`);
        continue;
      }

      try {
        await processImageFile(file);
      } catch (error) {
        console.error(`Error processing ${file.name}:`, error);
        toast.error(`Failed to scan ${file.name}`);
      }
    }

    setIsProcessing(false);

    // Reset file input to allow selecting the same file again if needed
    if (event.target === fileInputRef.current) {
      fileInputRef.current.value = '';
    } else if (event.target === cameraInputRef.current) {
      cameraInputRef.current.value = '';
    }
  };

  const handleSuccessfulScan = (barcode: string, source: string) => {
    // if (scannedItems.some((item) => item.barcode === barcode)) {
    //   toast.error(`Barcode ${barcode} already scanned`);
    //   return;
    // }

    const newItem: ScannedItem = {
      barcode,
      fileName: source,
    };

    setScannedItem(newItem);
    setIsOpen(true);
    toast.success(`Barcode scanned: ${barcode}`);
  };

  const processImageFile = async (file: File): Promise<void> => {
    initializeScanner();

    if (!scannerRef.current) {
      toast.error('Scanner not initialized');
      return;
    }

    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();

      fileReader.onload = async () => {
        try {
          if (typeof fileReader.result !== 'string') {
            reject(new Error('Failed to read file'));
            return;
          }

          const result = await scannerRef.current!.scanFileV2(file, false);
          const barcode = result.decodedText;
          handleSuccessfulScan(barcode, file.name);
          resolve();
        } catch (error) {
          console.log(error);
          toast.error(`No barcode found in ${file.name}`);
          resolve();
        }
      };

      fileReader.onerror = () => {
        reject(new Error('File reading failed'));
      };

      fileReader.readAsDataURL(file);
    });
  };

  return (
    <section className="space-y-4 max-w-lg mx-auto">
      <div className="relative flex h-44 items-center justify-center bg-muted rounded-md border border-dashed border-gray-300">
        {/* Scanner container */}
        <div
          id="scanner-container"
          ref={scannerContainerRef}
          className={cn('absolute inset-0')}
          style={{ display: 'none' }}
        />

        {/* hidden file inputs */}
        <div className="">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/*"
          />

          <input
            type="file"
            ref={cameraInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/*"
            capture="environment"
          />
        </div>

        {isCameraActive ? (
          <div className="absolute bottom-4 left-0 right-0 flex justify-center">
            <Button
              variant="destructive"
              size="sm"
              onClick={stopCameraScanner}
              className="rounded-full"
            >
              Cancel Scan
            </Button>
          </div>
        ) : isProcessing ? (
          <p className="block rounded bg-[#D9D9D9] px-3 py-[2px] text-base">
            Processing...
          </p>
        ) : (
          <Dialog>
            <DialogTrigger className="rounded px-3 py-[2px] flex flex-col gap-2 items-center cursor-pointer font-semibold text-[hsl(0,0%,55%)]">
              <Scan className="size-12 animate-pulse text-[hsl(0,0%,55%)]" />
              Click to scan
            </DialogTrigger>

            <DialogContent>
              <DialogHeader>
                <DialogTitle>Select option</DialogTitle>
                <DialogDescription></DialogDescription>
              </DialogHeader>

              <div className="flex flex-row items-center gap-6 justify-between">
                <button
                  onClick={triggerFileInput}
                  className="flex flex-col items-center gap-2"
                >
                  <Upload className="size-10 text-[hsl(0,0%,55%)]" />
                  <span className="block rounded bg-[#D9D9D9] px-3 py-[2px] text-sm">
                    Upload Image
                  </span>
                </button>

                <button
                  onClick={startCameraScanner}
                  className="flex flex-col items-center gap-2"
                >
                  <Camera className="size-10 text-[hsl(0,0%,55%)]" />
                  <span className="block rounded bg-[#D9D9D9] px-3 py-[2px] text-sm">
                    Use Camera
                  </span>
                </button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* export  */}
      <Drawer open={isOpen} onOpenChange={setIsOpen}>
        <DrawerTrigger></DrawerTrigger>

        <DrawerContent className="h-[40%] px-4">
          <DrawerHeader className="justify-center flex items-center">
            <DrawerTitle className="text-3xl">Scanned code</DrawerTitle>
            <DrawerDescription></DrawerDescription>
          </DrawerHeader>

          <div className="flex items-center gap-4 justify-center">
            <p className="text-base font-medium max-w-[15rem] truncate tracking-widest">
              {scannedItem?.barcode}
            </p>
            <CopyButton textToCopy={scannedItem?.barcode as string} />
          </div>

          <DrawerFooter>
            <DrawerClose>
              <Button variant="outline" className="cursor-pointer">
                Close
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </section>
  );
}
