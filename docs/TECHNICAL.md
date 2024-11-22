# Technical Documentation

## Implementation Details

### Core Technologies
- Three.js for 3D rendering
- WebGL for hardware acceleration
- WebRTC for webcam access
- TypeScript for type safety

### Point Cloud Generation
- Adjustable resolution via GUI
  - Width: 320-1280 pixels
  - Height: 240-720 pixels (maintains 4:3 aspect ratio)
- Real-time conversion from video feed
- Dynamic depth mapping based on pixel brightness
- RGB color preservation from source
- Default resolution: 640x480
- Maximum resolution: 1280x720 (720p)

### Performance Optimizations
- Efficient buffer geometry updates
- requestAnimationFrame for smooth rendering
- Proper WebGL resource cleanup
- Optimized memory management
- Event listener cleanup on unmount

### Parameters

| Parameter | Type | Range | Default | Description |
|-----------|------|-------|---------|-------------|
| resolution | object | - | - | Video resolution settings |
| - width | number | 320-1280 | 640 | Width in pixels |
| - height | number | 240-720 | 480 | Height in pixels |
| pointSize | number | 1-5 | 2 | Point size in pixels |
| depthScale | number | 0.5-5 | 2 | Z-axis scaling factor |
| rotationSpeed | number | 0.01-0.5 | 0.1 | Rotation interpolation speed |
| colorIntensity | number | 0.1-2 | 1 | Color saturation multiplier |
| redMultiplier | number | 0-2 | 1 | Red channel multiplier |
| greenMultiplier | number | 0-2 | 1 | Green channel multiplier |
| blueMultiplier | number | 0-2 | 1 | Blue channel multiplier |
| autoRotate | boolean | - | false | Enable automatic rotation |
| autoRotateSpeed | number | 0.001-0.05 | 0.01 | Auto rotation speed |
| lockRotation | boolean | - | false | Lock all rotation controls |

### Controls
- Mouse drag for manual rotation (when not locked)
- Mouse wheel for zoom
- Automatic rotation with adjustable speed
- Rotation lock to freeze current orientation

### Technical Requirements

#### Browser APIs
- WebGL 1.0+
- getUserMedia
- requestAnimationFrame
- Canvas 2D Context

#### Hardware
- WebGL-capable GPU
- Webcam
- Minimum 2GB RAM recommended

### Error Handling
- Webcam access failure detection
- WebGL context loss recovery
- Script loading error handling
- Resource cleanup on component unmount

### Memory Management
- Proper disposal of Three.js objects
- Event listener cleanup
- WebGL context cleanup
- Video stream track stopping
