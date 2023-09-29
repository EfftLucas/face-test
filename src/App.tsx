import { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import * as faceapi from "face-api.js";
import { ArrowLeft, ArrowRight } from "@phosphor-icons/react";

interface Point {
  x: number;
  y: number;
}

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
      await faceapi.loadTinyFaceDetectorModel("/models");
      await faceapi.loadFaceLandmarkTinyModel("/models");
      await faceapi.loadFaceLandmarkTinyModel("/models");
    };

    const analyzeEmotions = async () => {
      await loadModels();

      const currentWebcam = webcamRef.current?.video;

     if(currentWebcam) {
      setInterval(async () => {
        const detections = await faceapi
          .detectSingleFace(currentWebcam, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks(true)
          

        if (detections) {
          const face = detections;
          // Detecta a orientação do rosto
          const eye_right = getMeanPosition(face.landmarks.getRightEye());
          const eye_left = getMeanPosition(face.landmarks.getLeftEye());
          const nose = getMeanPosition(face.landmarks.getNose());
          const mouth = getMeanPosition(face.landmarks.getMouth());
          const jaw = getTop(face.landmarks.getJawOutline());

          const rx = (jaw - mouth[1]) / face.detection.box.height + 0.5;
          const ry =
            (eye_left[0] + (eye_right[0] - eye_left[0]) / 2 - nose[0]) /
            face.detection.box.width;

          let state = "undetected";
          if (face.detection.score > 0.3) {
            state = "Frente";
            if (rx > 0.2) {
              state = "Cima";
            } else {
              if (ry < -0.04) {
                state = "Esquerda";
              }
              if (ry > 0.04) {
                state = "Direita";
              }
            }
          }

          // Use 'state' for further processing based on face orientation
          setFaceOrientation(state);
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
        <Webcam mirrored className="w-full" videoConstraints={{ width: 720, height: 560, facingMode: 'user' }} ref={webcamRef} width={720} height={560}></Webcam>
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

function getTop(l: Point[]): number {
  return l.map((a) => a.y).reduce((a, b) => Math.min(a, b));
}

function getMeanPosition(l: Point[]): number[] {
  const sum = l.reduce((a, b) => [a[0] + b.x, a[1] + b.y], [0, 0]);
  return [sum[0] / l.length, sum[1] / l.length];
}
