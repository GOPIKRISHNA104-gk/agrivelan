import React, { useRef, useState, useEffect } from 'react';
import { analyzeProduceImage, type DetectionResult } from '../services/detection';

interface AnalysisResult {
    detected: boolean;
    product?: string;
    category?: string;
    grade?: string;
    gradeLabel?: string;
    confidence?: number;
    reason?: string;
}

const StrictFarmerCamera = ({ onPostSuccess, onCancel, speak }: any) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [image, setImage] = useState<string | null>(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [quantity, setQuantity] = useState('');
    const [price] = useState('10'); // Default or fetched price
    const quantityInputRef = useRef<HTMLInputElement>(null);

    // 1. Initialize Camera
    useEffect(() => {
        startCamera();
        return () => stopCamera();
    }, []);

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' } // Use back camera
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err) {
            console.error("Camera access denied:", err);
            alert("Please allow camera access to sell produce.");
            onCancel();
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    };

    // 2. Capture and Analyze
    const handleCapture = async () => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;

        // Crop to square to match the UI preview
        const size = Math.min(video.videoWidth, video.videoHeight);
        const startX = (video.videoWidth - size) / 2;
        const startY = (video.videoHeight - size) / 2;

        canvas.width = size;
        canvas.height = size;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Draw only the center square
        ctx.drawImage(video, startX, startY, size, size, 0, 0, size, size);

        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        setImage(imageData);
        stopCamera(); // Stop camera stream while analyzing

        analyzeImage(imageData);
    };

    const analyzeImage = async (imgData: string) => {
        setAnalyzing(true);
        setResult(null);
        setQuantity('');

        try {
            if (speak) speak("Analyzing produce...", "en-US");

            // Use unified detection service (works locally and on Vercel)
            const data = await analyzeProduceImage(imgData);
            setResult(data as AnalysisResult);

            if (data.detected) {
                if (speak) speak(`${data.product} detected. Grade ${data.grade}. Please enter quantity.`, "en-US");
                // Focus quantity input after render
                setTimeout(() => {
                    if (quantityInputRef.current) quantityInputRef.current.focus();
                }, 500);
            } else {
                if (speak) speak(`Detection failed. ${data.reason}`, "en-US");
            }

        } catch (error) {
            console.error("Analysis failed:", error);
            setResult({
                detected: false,
                reason: "Analysis failed. Please try again."
            });
        } finally {
            setAnalyzing(false);
        }
    };

    const handleRetake = () => {
        setImage(null);
        setResult(null);
        setQuantity('');
        startCamera();
    };

    const handlePost = () => {
        if (!result || !result.detected || !quantity) return;

        // Construct post data strictly from detection result
        const postData = {
            product: result.product,
            category: result.category,
            grade: result.grade,
            quantity: Number(quantity),
            price: Number(price), // Ideally this comes from market data logic
            image: image,
            detectedAt: new Date().toISOString()
        };

        onPostSuccess(postData);
    };

    // --- RENDER ---

    // Step Indicator Calculation
    const currentStep = !image ? 1 : (result && result.detected) ? 3 : 2;

    // A. Camera View (Box UI)
    if (!image) {
        return (
            <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col items-center justify-center">
                {/* Cancel Button */}
                <button
                    onClick={onCancel}
                    className="absolute top-6 left-6 z-20 bg-black/40 text-white p-2 rounded-full hover:bg-black/60 transition-colors backdrop-blur-sm"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* Camera Box */}
                <div className="relative w-[70vw] h-[70vw] max-w-[350px] max-h-[350px] rounded-3xl overflow-hidden border-[6px] border-green-500 shadow-2xl bg-black">
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                </div>

                {/* Instruction Text */}
                <p className="mt-8 text-white font-bold text-lg md:text-xl text-center px-6 tracking-wide drop-shadow-md font-sans">
                    Place <span className="text-green-400">ONE</span> product in the box
                </p>

                {/* Capture Button */}
                <div className="mt-10 pb-8">
                    <button
                        onClick={handleCapture}
                        className="w-20 h-20 bg-green-600 rounded-full border-4 border-white shadow-xl flex items-center justify-center active:scale-90 transition-all transform hover:bg-green-500 ring-4 ring-green-600/30"
                        aria-label="Capture"
                    >
                        <div className="w-16 h-16 rounded-full border border-green-800/20"></div>
                    </button>
                    <canvas ref={canvasRef} className="hidden" />
                </div>
            </div>
        );
    }

    // B. Analysis/Result View
    return (
        <div className="fixed inset-0 bg-white z-50 flex flex-col overflow-y-auto">
            <div className="w-full py-4 border-b border-gray-100 bg-white sticky top-0 z-20 shadow-sm flex justify-center space-x-8">
                <div className={`flex flex-col items-center ${currentStep >= 1 ? 'text-green-700' : 'text-gray-300'}`}>
                    <div className="w-6 h-6 rounded-full border-2 border-current flex items-center justify-center text-xs font-bold mb-1">✓</div>
                    <span className="text-[10px] font-bold uppercase">Capture</span>
                </div>
                <div className={`flex flex-col items-center ${currentStep >= 2 ? 'text-green-700' : 'text-gray-300'}`}>
                    <div className="w-6 h-6 rounded-full border-2 border-current flex items-center justify-center text-xs font-bold mb-1">
                        {analyzing ? '...' : (result?.detected ? '✓' : '2')}
                    </div>
                    <span className="text-[10px] font-bold uppercase">Detect</span>
                </div>
                <div className={`flex flex-col items-center ${currentStep >= 3 ? 'text-green-700' : 'text-gray-300'}`}>
                    <div className="w-6 h-6 rounded-full border-2 border-current flex items-center justify-center text-xs font-bold mb-1">3</div>
                    <span className="text-[10px] font-bold uppercase">Quantity</span>
                </div>
            </div>

            <div className="relative h-64 bg-gray-100 flex-shrink-0">
                <img src={image} alt="Captured" className="w-full h-full object-contain" />
                <button onClick={handleRetake} className="absolute top-4 left-4 bg-black/50 text-white px-4 py-2 rounded-lg font-bold text-sm backdrop-blur-md hover:bg-black/70 transition">
                    ← RETAKE
                </button>
            </div>

            <div className="flex-1 p-6 flex flex-col max-w-lg mx-auto w-full">
                {analyzing ? (
                    <div className="flex-1 flex flex-col items-center justify-center space-y-6 py-12">
                        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-green-600"></div>
                        <div className="text-center space-y-2">
                            <h3 className="text-xl font-bold text-gray-800">Analyzing Produce...</h3>
                            <p className="text-sm text-gray-500">Checking quality, shape & texture</p>
                        </div>
                    </div>
                ) : result?.detected ? (
                    // SUCCESS STATE
                    <div className="flex-1 flex flex-col space-y-6 animate-fadeIn">
                        {/* Product Badge */}
                        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{result.category}</span>
                                <div className={`px-3 py-1 rounded-md text-white font-bold text-xs uppercase tracking-wide ${result.grade === 'A' ? 'bg-green-600' : result.grade === 'B' ? 'bg-amber-500' : 'bg-red-500'
                                    }`}>
                                    Grade {result.grade}
                                </div>
                            </div>
                            <h2 className="text-4xl font-extrabold text-gray-900">{result.product}</h2>
                            <p className="text-green-600 text-sm font-bold mt-1">✓ Verified Quality</p>
                        </div>

                        {/* Quantity Input - STRICT STYLING */}
                        <div className="space-y-2">
                            <label className="block text-green-900 font-bold text-center text-lg uppercase tracking-wide">Enter Quantity (KG)</label>
                            <input
                                ref={quantityInputRef}
                                type="number"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                className="w-full text-center text-5xl font-extrabold text-green-900 bg-green-50 border-4 border-green-500 rounded-2xl py-8 focus:outline-none focus:ring-4 focus:ring-green-300 focus:border-green-600 transition-all placeholder-green-200/50"
                                placeholder="0"
                                autoFocus
                            />
                        </div>

                        <div className="flex-1"></div>

                        <button onClick={handlePost} disabled={!quantity || Number(quantity) <= 0}
                            className="w-full bg-green-700 text-white py-5 rounded-2xl font-bold text-xl shadow-xl hover:bg-green-800 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-all uppercase tracking-wider mb-8">
                            POST TO MARKET
                        </button>
                    </div>
                ) : (
                    // FAILURE STATE
                    <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8 py-8">
                        <div className="bg-red-50 p-6 rounded-full">
                            <span className="text-6xl">🚫</span>
                        </div>

                        <div className="space-y-2 w-full">
                            <h3 className="text-2xl font-bold text-red-700">Detection Failed</h3>
                            <div className="bg-red-100 text-red-800 p-4 rounded-xl font-medium border border-red-200 text-lg">
                                {result?.reason || "Could not identify produce"}
                            </div>
                        </div>

                        <ul className="text-left text-gray-600 space-y-2 bg-gray-50 p-6 rounded-xl text-sm w-full">
                            <li className="flex items-center"><span className="text-red-500 mr-2">●</span> Ensure ONLY ONE item is visible</li>
                            <li className="flex items-center"><span className="text-red-500 mr-2">●</span> Avoid blur and bad lighting</li>
                            <li className="flex items-center"><span className="text-red-500 mr-2">●</span> Keep faces out of frame</li>
                        </ul>

                        <button onClick={handleRetake}
                            className="w-full bg-gray-900 text-white py-5 rounded-2xl font-bold text-xl hover:bg-black transition-all shadow-lg uppercase tracking-wider">
                            RETAKE PHOTO
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StrictFarmerCamera;
