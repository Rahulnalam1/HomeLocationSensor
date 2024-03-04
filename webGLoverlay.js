import React, { useEffect, useRef } from "react";
import { AmbientLight, DirectionalLight, Matrix4, PerspectiveCamera, Scene, WebGLRenderer } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

const MapComponent = () => {
  const mapDivRef = useRef(null);
  let map;
  let scene, renderer, camera, loader;

  useEffect(() => {
    const mapOptions = {
      tilt: 0,
      heading: 0,
      zoom: 18,
      center: { lat: 40.0067000, lng: 83.0305000 },
      mapId: "cff5de67eb4b3153",
      // disable interactions due to animation loop and moveCamera
      disableDefaultUI: true,
      gestureHandling: "none",
      keyboardShortcuts: false,
    };

    const initMap = () => {
      map = new window.google.maps.Map(mapDivRef.current, mapOptions);
      initWebglOverlayView(map);
    };

    const initWebglOverlayView = (map) => {
      const webglOverlayView = new window.google.maps.WebGLOverlayView();

      webglOverlayView.onAdd = () => {
        scene = new Scene();
        camera = new PerspectiveCamera();

        const ambientLight = new AmbientLight(0xffffff, 0.75); // Soft white light.
        scene.add(ambientLight);

        const directionalLight = new DirectionalLight(0xffffff, 0.25);
        directionalLight.position.set(0.5, -1, 0.5);
        scene.add(directionalLight);

        loader = new GLTFLoader();
        const source = "https://raw.githubusercontent.com/googlemaps/js-samples/main/assets/pin.gltf";
        loader.load(source, (gltf) => {
          gltf.scene.scale.set(10, 10, 10);
          gltf.scene.rotation.x = Math.PI;
          scene.add(gltf.scene);
        });
      };

      webglOverlayView.onContextRestored = ({ gl }) => {
        renderer = new WebGLRenderer({
          canvas: gl.canvas,
          context: gl,
          ...gl.getContextAttributes(),
        });
        renderer.autoClear = false;

        loader.manager.onLoad = () => {
          renderer.setAnimationLoop(() => {
            webglOverlayView.requestRedraw();
            const { tilt, heading, zoom } = mapOptions;
            map.moveCamera({ tilt, heading, zoom });

            if (mapOptions.tilt < 67.5) {
              mapOptions.tilt += 0.5;
            } else if (mapOptions.heading <= 360) {
              mapOptions.heading += 0.2;
              mapOptions.zoom -= 0.0005;
            } else {
              renderer.setAnimationLoop(null);
            }
          });
        };
      };

      webglOverlayView.onDraw = ({ gl, transformer }) => {
        const latLngAltitudeLiteral = {
          lat: mapOptions.center.lat,
          lng: mapOptions.center.lng,
          altitude: 100,
        };

        const matrix = transformer.fromLatLngAltitude(latLngAltitudeLiteral);
        camera.projectionMatrix = new Matrix4().fromArray(matrix);

        webglOverlayView.requestRedraw();
        renderer.render(scene, camera);
        renderer.resetState();
      };
      webglOverlayView.setMap(map);
    };

    window.initMap = initMap;
    initMap();

    // Clean up function
    return () => {
      if (map) {
        map = null;
      }
      if (renderer) {
        renderer.dispose();
        renderer.forceContextLoss();
      }
      if (loader) {
        loader = null;
      }
    };
  }, []);

  return <div id="map" ref={mapDivRef} style={{ width: "100%", height: "100vh" }} />;
};

export default MapComponent;

//remember to replace the window.google.maps.Map and window.google.maps.WebGLOverlayView calls with appropriate //typings if you are using TypeScript
