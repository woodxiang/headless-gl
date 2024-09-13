const path = require('path');
const NativeWebGL = require('node-gyp-build')(path.join(__dirname, '../../'));
const { WebGLRenderingContext: NativeWebGLRenderingContext } = NativeWebGL;
process.on('exit', NativeWebGL.cleanup);

const gl = NativeWebGLRenderingContext.prototype;

// from binding.gyp
delete gl['1.0.0'];

// from binding.gyp
delete NativeWebGLRenderingContext['1.0.0'];

module.exports = { gl, NativeWebGL, NativeWebGLRenderingContext };
