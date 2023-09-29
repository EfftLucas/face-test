import { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import * as faceapi from "face-api.js";
import { ArrowLeft, ArrowRight } from "@phosphor-icons/react";

export function App() {
  const webcamRef = useRef<Webcam>(null);
  const downloadRef = useRef<HTMLAnchorElement>(null);
  const [isLiveness, setIsLiveness] = useState(false);
  const [canTakePhoto, setCanTakePhoto] = useState(false);
  const [hasTurnedRight, setHasTurnedRight] = useState(false);
  const [hasTurnedLeft, setHasTurnedLeft] = useState(false);
  const [faceOrientationGuide, setFaceOrientationGuide] = useState<string | null>(null); 
  const [faceOrientation, setFaceOrientation] = useState<string | null>(null);

  useEffect(() => {
    const loadModels = async () => {
      await faceapi.loadSsdMobilenetv1Model("/models");
      await faceapi.loadFaceExpressionModel("/models");
      await faceapi.loadFaceLandmarkModel("/models");
    };

    const analyzeEmotions = async () => {
      await loadModels();

      const currentWebcam = webcamRef.current?.video;

     if(currentWebcam) {
      setInterval(async () => {
        const detections = await faceapi
          .detectAllFaces(currentWebcam, new faceapi.SsdMobilenetv1Options())
          .withFaceLandmarks()
          .withFaceExpressions();
          

        if (detections.length > 0) {
          const face = detections[0];
          // Detecta a orientação do rosto
          const leftEye = face.landmarks.getLeftEye()[0];
          const rightEye = face.landmarks.getRightEye()[0];

          // Defina faixas de valores para determinar a orientação
          const leftThreshold = 300;
          const rightThreshold = 400;

          if (leftEye.x > rightThreshold && rightEye.x > rightThreshold) {
            setFaceOrientation("Esquerda");
          } else if (leftEye.x < leftThreshold && rightEye.x > leftThreshold) {
            setFaceOrientation("Direita");
          } else {
            setFaceOrientation("Neutral");
        }
        } else {
          setFaceOrientation(null);
        }
      }, 1000);
     }
    };

    analyzeEmotions();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (isLiveness) {
        if(!hasTurnedLeft) {
          setFaceOrientationGuide("Esquerda");
        } else if (!hasTurnedRight) {
          setFaceOrientationGuide("Direita");
        }
        
        if(!hasTurnedLeft && faceOrientation === "Esquerda" && faceOrientationGuide === "Esquerda") {
          setHasTurnedLeft(true);
        }

        if(hasTurnedLeft && !hasTurnedRight && faceOrientation === "Direita" && faceOrientationGuide === "Direita") {
          setHasTurnedRight(true);
        }

        if(hasTurnedRight && hasTurnedLeft) {
          setIsLiveness(false);
          setCanTakePhoto(true);
          setFaceOrientationGuide(null);
          window.alert("Prova de vida realizada com sucesso!")
        }
      }
    }, 100);
    return () => clearInterval(interval);
  }, [faceOrientation, isLiveness, hasTurnedLeft, hasTurnedRight, faceOrientationGuide])

  function handleTakePhoto() {
    const imageSrc = webcamRef.current?.getScreenshot();
    downloadRef.current?.setAttribute("href", imageSrc!);
    downloadRef.current?.setAttribute("download", "foto.png");
  }

  function handleLiveness() {
    setIsLiveness(true);
    setHasTurnedRight(false);
    setHasTurnedLeft(false);
    setFaceOrientationGuide(null);
    setCanTakePhoto(false);
  }


  return (
    <>
      <div className="m-auto w-1/2 h-auto relative">
        <Webcam mirrored className="w-full" ref={webcamRef} width={720} height={560}></Webcam>
        {faceOrientationGuide === "Direita" && 
        <div className="absolute top-0 right-0 h-full bg-zinc-700 bg-opacity-75 flex justify-center items-center animate-pulse">
          <ArrowRight className="text-zinc-950 animate-pulse" height={200} width={200} />
        </div>
        }
        {faceOrientationGuide === "Esquerda" &&
        <div className="absolute top-0 left-0 h-full bg-transparent flex justify-center items-center bg-zinc-700 bg-opacity-75 animate-pulse">
          <ArrowLeft className="text-zinc-950 animate-pulse" height={200} width={200} />
        </div>
        }
        
      </div>
      {canTakePhoto && <button onClick={handleTakePhoto}>Tirar foto</button>}
      <button onClick={handleLiveness}>Prova de vida</button>
      <div className="text-3xl font-bold underline">{faceOrientationGuide && `Vire o rosto para ${faceOrientationGuide}`}</div>
      <a className="text-3xl font-bold underline" ref={downloadRef}>Download</a>
    </>
  );
}
