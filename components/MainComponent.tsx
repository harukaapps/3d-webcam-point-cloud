"use client";
import React, { useRef, useEffect } from "react";

// Three.jsの型定義
declare global {
  interface Window {
    THREE: any;
    dat: any;
  }
}

interface Point {
  x: number;
  y: number;
}

interface Rotation {
  x: number;
  y: number;
}

interface Parameters {
  resolution: {
    width: number;
    height: number;
  };
  pointSize: number;
  depthScale: number;
  rotationSpeed: number;
  colorIntensity: number;
  redMultiplier: number;
  greenMultiplier: number;
  blueMultiplier: number;
  autoRotate: boolean;
  autoRotateSpeed: number;
  lockRotation: boolean;
  visualizationMode: string;  // View Mode用のパラメータを追加
}

function MainComponent() {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const isInitialized = useRef<boolean>(false);
  const currentResolution = useRef<{ width: number; height: number }>({ width: 640, height: 480 });
  const pointsRef = useRef<THREE.Points | null>(null);
  const geometryRef = useRef<THREE.BufferGeometry | null>(null);

  // スクリプトの動的読み込み
  const loadScript = async (src: string): Promise<void> => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = src;
      script.onload = () => resolve();
      document.body.appendChild(script);
    });
  };

  useEffect(() => {
    const loadScripts = async () => {
      try {
        await loadScript(
          "https://cdnjs.cloudflare.com/ajax/libs/three.js/0.158.0/three.min.js"
        );
        await loadScript(
          "https://cdnjs.cloudflare.com/ajax/libs/dat-gui/0.7.9/dat.gui.min.js"
        );
        
        // Webカメラの初期化
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({
              video: {
                width: { ideal: 1280 },
                height: { ideal: 720 },
                facingMode: "user"
              },
            });
            
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
              videoRef.current.play();
            }
          } catch (error) {
            console.error("Error accessing webcam:", error);
          }
        }

        initThree();
      } catch (error) {
        console.error("Error loading scripts:", error);
      }
    };

    loadScripts();

    // クリーンアップ関数
    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach((track) => track.stop());
      }
    };
  }, []);

  const initThree = () => {
    if (isInitialized.current || typeof window === "undefined") return;

    isInitialized.current = true;

    const THREE = window.THREE;
    const width = window.innerWidth;
    const height = window.innerHeight;

    // シーンのセットアップ
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, width / height, 1, 10000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000);

    if (containerRef.current) {
      containerRef.current.innerHTML = "";
      containerRef.current.appendChild(renderer.domElement);
    }

    // カメラの位置設定
    camera.position.z = 1000;

    // ジオメトリの作成
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(currentResolution.current.width * currentResolution.current.height * 3);
    const colors = new Float32Array(currentResolution.current.width * currentResolution.current.height * 3);

    // 初期位置と色の設定
    let index = 0;
    for (let y = 0; y < currentResolution.current.height; y++) {
      for (let x = 0; x < currentResolution.current.width; x++) {
        positions[index] = x - currentResolution.current.width / 2;
        positions[index + 1] = -(y - currentResolution.current.height / 2);
        positions[index + 2] = 0;

        colors[index] = 0;
        colors[index + 1] = 0;
        colors[index + 2] = 0;

        index += 3;
      }
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // マテリアルの作成
    const params: Parameters = {
      resolution: {
        width: currentResolution.current.width,
        height: currentResolution.current.height,
      },
      pointSize: 2,
      depthScale: 1,
      rotationSpeed: 0.1,
      colorIntensity: 1,
      redMultiplier: 1,
      greenMultiplier: 1,
      blueMultiplier: 1,
      autoRotate: false,
      autoRotateSpeed: 0.01,
      lockRotation: false,
      visualizationMode: "normal"  // デフォルトは通常表示
    };

    const material = new THREE.PointsMaterial({
      size: params.pointSize,
      vertexColors: true,
    });

    // ポイントクラウドの作成
    const points = new THREE.Points(geometry, material);
    scene.add(points);

    // 参照を保存
    geometryRef.current = geometry;
    pointsRef.current = points;

    // GUI設定
    const gui = new window.dat.GUI();
    const resolutionFolder = gui.addFolder('Resolution');
    resolutionFolder.add(params.resolution, "width", 320, 1280, 160).name("Width").onChange((value: number) => {
      params.resolution.height = Math.round(value * 0.75); // 4:3アスペクト比を維持
      updateResolution(params.resolution.width, params.resolution.height);
    });
    resolutionFolder.add(params.resolution, "height", 240, 720, 120).name("Height").onChange((value: number) => {
      params.resolution.width = Math.round(value * 4/3); // 4:3アスペクト比を維持
      updateResolution(params.resolution.width, params.resolution.height);
    });
    resolutionFolder.open();

    const controlsFolder = gui.addFolder('Controls');
    controlsFolder.add(params, "autoRotate").name("Auto Rotate");
    controlsFolder.add(params, "autoRotateSpeed", 0.001, 0.05).name("Auto Rotate Speed");
    controlsFolder.add(params, "lockRotation").name("Lock Rotation");
    controlsFolder.open();

    gui.add(params, "pointSize", 1, 5).onChange((value: number) => {
      material.size = value;
    });
    gui.add(params, "depthScale", 0.5, 5).name("Depth Scale");
    gui.add(params, "rotationSpeed", 0.01, 0.5).name("Rotation Speed");
    gui.add(params, "colorIntensity", 0.1, 2).name("Color Intensity");
    gui.add(params, "redMultiplier", 0, 2).name("Red");
    gui.add(params, "greenMultiplier", 0, 2).name("Green");
    gui.add(params, "blueMultiplier", 0, 2).name("Blue");

    // View Modeフォルダを追加
    const viewModeFolder = gui.addFolder('View Mode');
    viewModeFolder.add(params, "visualizationMode", ["normal", "depth", "gradient"]).name("Mode");
    viewModeFolder.open();

    // ビデオキャンバスの設定
    const videoCanvas = document.createElement("canvas");
    videoCanvas.width = currentResolution.current.width;
    videoCanvas.height = currentResolution.current.height;
    const videoContext = videoCanvas.getContext("2d");

    // マウス操作の状態管理
    let isDragging = false;
    let previousMousePosition: Point = { x: 0, y: 0 };
    let rotation: Rotation = { x: 0, y: 0 };
    let targetRotation: Rotation = { x: 0, y: 0 };

    // マウスイベントハンドラ
    const handleMouseDown = (event: MouseEvent) => {
      if (params.lockRotation) return;
      isDragging = true;
      previousMousePosition = {
        x: event.clientX,
        y: event.clientY,
      };
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (!isDragging || params.lockRotation) return;

      const deltaMove = {
        x: event.clientX - previousMousePosition.x,
        y: event.clientY - previousMousePosition.y,
      };

      targetRotation.x += deltaMove.y * 0.005;
      targetRotation.y += deltaMove.x * 0.005;

      previousMousePosition = {
        x: event.clientX,
        y: event.clientY,
      };
    };

    const handleMouseUp = () => {
      isDragging = false;
    };

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      camera.position.z = Math.max(
        500,
        Math.min(2000, camera.position.z + event.deltaY)
      );
    };

    // イベントリスナーの設定
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("wheel", handleWheel, { passive: false });

    // 解像度更新関数
    const updateResolution = (width: number, height: number) => {
      if (!geometryRef.current || !pointsRef.current || !scene) return;

      // 現在の解像度を更新
      currentResolution.current = { width, height };

      // ビデオキャンバスのサイズを更新
      videoCanvas.width = width;
      videoCanvas.height = height;

      // 新しい頂点バッファを作成
      const numPoints = width * height;
      const newPositions = new Float32Array(numPoints * 3);
      const newColors = new Float32Array(numPoints * 3);

      // 初期位置の設定
      let index = 0;
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          newPositions[index] = x - width / 2;
          newPositions[index + 1] = -(y - height / 2);
          newPositions[index + 2] = 0;

          newColors[index] = 0;
          newColors[index + 1] = 0;
          newColors[index + 2] = 0;

          index += 3;
        }
      }

      // ジオメトリを更新
      geometryRef.current.setAttribute(
        "position",
        new THREE.BufferAttribute(newPositions, 3)
      );
      geometryRef.current.setAttribute(
        "color",
        new THREE.BufferAttribute(newColors, 3)
      );
    };

    // アニメーションループ
    const animate = () => {
      requestAnimationFrame(animate);
      
      if (videoContext && videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
        // ビデオフレームの取得
        videoContext.drawImage(
          videoRef.current,
          0,
          0,
          currentResolution.current.width,
          currentResolution.current.height
        );
        
        const imageData = videoContext.getImageData(
          0,
          0,
          currentResolution.current.width,
          currentResolution.current.height
        );
        const data = imageData.data;

        // ポイントクラウドの更新
        if (geometryRef.current && geometryRef.current.attributes.position.array) {
          const positions = geometryRef.current.attributes.position.array as Float32Array;
          const colors = geometryRef.current.attributes.color.array as Float32Array;
          let index = 0;
          let pixelIndex = 0;

          for (let i = 0; i < data.length; i += 4) {
            const r = data[i] / 255;
            const g = data[i + 1] / 255;
            const b = data[i + 2] / 255;
            const brightness = (r + g + b) / 3;

            // 深度の計算
            positions[index + 2] = brightness * params.depthScale * 100;

            // 色の設定
            switch (params.visualizationMode) {
              case "depth":
                // 深度マップ表示（グレースケール）
                const depth = brightness;
                colors[index] = depth;
                colors[index + 1] = depth;
                colors[index + 2] = depth;
                break;
              
              case "gradient":
                // グラデーション表示（深度に基づく）
                const gradientValue = brightness;
                colors[index] = gradientValue;     // 赤成分
                colors[index + 1] = 0.5;          // 緑成分（固定）
                colors[index + 2] = 1 - gradientValue; // 青成分
                break;
              
              default: // "normal"
                // 通常表示（カラー）
                colors[index] = r * params.colorIntensity * params.redMultiplier;
                colors[index + 1] = g * params.colorIntensity * params.greenMultiplier;
                colors[index + 2] = b * params.colorIntensity * params.blueMultiplier;
                break;
            }

            index += 3;
            pixelIndex += 4;
          }

          geometryRef.current.attributes.position.needsUpdate = true;
          geometryRef.current.attributes.color.needsUpdate = true;
        }
      }

      // 回転の更新
      if (!params.lockRotation) {
        if (params.autoRotate) {
          targetRotation.y += params.autoRotateSpeed;
        }
        rotation.x += (targetRotation.x - rotation.x) * params.rotationSpeed;
        rotation.y += (targetRotation.y - rotation.y) * params.rotationSpeed;
      }

      if (pointsRef.current && pointsRef.current.rotation) {
        pointsRef.current.rotation.x = rotation.x;
        pointsRef.current.rotation.y = rotation.y;
      }

      renderer.render(scene, camera);
    };

    // リサイズハンドラ
    const handleResize = () => {
      if (!containerRef.current) return;
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };

    window.addEventListener("resize", handleResize);
    animate();

    // クリーンアップ関数
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("wheel", handleWheel);
      containerRef.current?.removeChild(renderer.domElement);
      geometryRef.current?.dispose();
      material.dispose();
      renderer.dispose();
      gui.destroy();
    };
  };

  return (
    <div ref={containerRef} style={{ width: "100%", height: "100vh" }}>
      <video
        ref={videoRef}
        style={{ display: "none" }}
        playsInline
        autoPlay
        muted
      />
    </div>
  );
}

export default MainComponent;

