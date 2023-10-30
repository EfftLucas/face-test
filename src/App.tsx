import { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import * as faceapi from "face-api.js";

export function App() {
  const webcamRef = useRef<Webcam>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [isLiveness, setIsLiveness] = useState(false);
  const [isSmiling, setIsSmiling] = useState(false);
  const [canTakePhoto, setCanTakePhoto] = useState(false);
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
                console.log("Smile detected.");
              } else if (isNeutral && detections.expressions.neutral > 0.8) {
                
                setIsNeutral(false);
                setCanTakePhoto(true);
                console.log("Neutral expression detected.");
              }
            }
          }, 100);
        }
      }
    };

    analyzeEmotions();
    return () => clearInterval(interval);
  }, [isLiveness, isSmiling, isNeutral]);

  function handleSmile() {
    setIsLiveness(true);
    setIsSmiling(true);
  }

  return (
    <>
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
              className="mt-1 inline-block shrink-0 w-full rounded-md border border-blue-600 bg-blue-600 px-12 py-3 text-sm font-medium text-white transition hover:bg-transparent hover:text-blue-600 focus:outline-none focus:ring active:text-blue-500 dark:hover:bg-blue-700 dark:hover:text-white text-center"
              onClick={() => {
                setCanTakePhoto(false);
                setIsNeutral(false); // Reset neutrality state
              }}
            >
              Remover Foto
            </a>
          )}
        </div>
      ) : (
        "Carregando modelos..."
      )}
    </>
  );
}
