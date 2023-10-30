import { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import * as faceapi from "face-api.js";
import { ToastContainer, toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

export function App() {
  const webcamRef = useRef<Webcam>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [isLiveness, setIsLiveness] = useState(false);
  const [isSmiling, setIsSmiling] = useState(false);
  const [canTakePhoto, setCanTakePhoto] = useState(false);
  const [isPhotoTaken, setIsPhotoTaken] = useState(false);
  const [isPhotoSaved, setIsPhotoSaved] = useState('');
  const [isNeutral, setIsNeutral] = useState(false);

  useEffect(() => {
    let interval: number | undefined = undefined;
    const loadModels = async () => {
      try {
        await faceapi.loadTinyFaceDetectorModel("/models");
        await faceapi.loadFaceLandmarkTinyModel("/models");
        await faceapi.loadFaceRecognitionModel("/models");
        await faceapi.loadFaceExpressionModel("/models");
        console.log("Models loaded");
        setModelsLoaded(true);
      } catch (error) {
        console.log(error);
      }
    };

    const analyzeEmotions = async () => {
      await loadModels();

      if (isLiveness) {
        const currentWebcam = webcamRef.current?.video;

        if (currentWebcam) {
          interval = setInterval(async () => {
            const detections = await faceapi
              .detectSingleFace(currentWebcam, new faceapi.TinyFaceDetectorOptions())
              .withFaceLandmarks(true).withFaceExpressions();

            if (detections) {
              if (detections.expressions.happy > 0.8 && isSmiling) {
                
                setIsSmiling(false);
                setIsNeutral(true);
                toast('Fique normal!', {type: 'info'})
              } else if (isNeutral && detections.expressions.neutral > 0.8) {
                
                setIsNeutral(false);
                setCanTakePhoto(true);
                handleTakePhoto()
              }
            }
          }, 100);
        }
      }

      function handleTakePhoto() {
        console.log('aa')
        setIsPhotoTaken(true);
        setCanTakePhoto(false);
    
        setTimeout(() => {
          const photo = webcamRef.current?.getScreenshot();
    
        if (photo) {
          setIsPhotoSaved(photo);
          toast('Foto tirada com sucesso!', {type: 'success'})
        }
        }, 2000)
      }
    };

    

    analyzeEmotions();
    return () => {
      clearInterval(interval)
    };
  }, [isLiveness, isSmiling, isNeutral]);

  

  function handleSmile() {
    toast('Sorria!', {type: 'info'})
    setIsLiveness(true);
    setIsSmiling(true);
  }

  return (
    <>
    <ToastContainer />
      {modelsLoaded ? (
        <div className="m-auto w-1/2 h-auto relative">
          <Webcam
            mirrored
            className="w-1/2"
            screenshotFormat={"image/jpeg"}
            screenshotQuality={0.8}
            videoConstraints={{ width: 300, height: 300, facingMode: "user" }}
            ref={webcamRef}
            width={300}
            height={300}
          ></Webcam>
          {!canTakePhoto && (
            <button
              className="mt-1 inline-block shrink-0 w-full rounded-md border border-blue-600 bg-blue-600 px-12 py-3 text-sm font-medium text-white transition hover:bg-transparent hover:text-blue-600 focus:outline-none focus:ring active:text-blue-500 dark:hover:bg-blue-700 dark:hover:text-white"
              onClick={handleSmile}
            >
              Sorria!
            </button>
          )}
          {canTakePhoto && (
            <a
              className="mt-1 inline-block shrink-0 w-1/2 rounded-md border border-blue-600 bg-blue-600 px-12 py-3 text-sm font-medium text-white transition hover:bg-transparent hover:text-blue-600 focus:outline-none focus:ring active:text-blue-500 dark:hover:bg-blue-700 dark:hover:text-white text-center"
              onClick={() => {
                setCanTakePhoto(false);
                setIsNeutral(false); // Reset neutrality state
              }}
            >
              Remover Foto
            </a>
          )}

          {isPhotoTaken && isPhotoSaved && (
            <img
              className="mt-1 inline-block shrink-0 w-full rounded-md border border-blue-600 bg-blue-600 px-12 py-3 text-sm font-medium text-white transition hover:bg-transparent hover:text-blue-600 focus:outline-none focus:ring active:text-blue-500 dark:hover:bg-blue-700 dark:hover:text-white text-center"
              src={isPhotoSaved}
              alt="Foto tirada"
            />

          )}
        </div>
      ) : (
        "Carregando modelos..."
      )}
    </>
  );
}
