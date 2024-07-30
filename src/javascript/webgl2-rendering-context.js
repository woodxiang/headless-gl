const { WebGLRenderingContext } = require('./webgl-rendering-context');
const { WebGLVertexArrayObject } = require('./webgl-vertex-array-object.js');
const { gl } = require('./native-gl');
const { checkObject, convertPixels, checkFormat, validCubeTarget } = require('./utils');

class WebGL2RenderingContext extends WebGLRenderingContext {
  constructor() {
    super();
    this.isWebGL2 = true;
  }

  _wrapShader(type, source) {
    // eslint-disable-line
    // the gl implementation seems to define `GL_OES_standard_derivatives` even when the extension is disabled
    // this behaviour causes one conformance test ('GL_OES_standard_derivatives defined in shaders when extension is disabled') to fail
    // by `undef`ing `GL_OES_standard_derivatives`, this appears to solve the issue
    if (!this._extensions.oes_standard_derivatives && /#ifdef\s+GL_OES_standard_derivatives/.test(source)) {
      source = '#undef GL_OES_standard_derivatives\n' + source;
    }

    return source;
  }

  /**
   * webgl2
   */

  // void gl.texImage3D(target, level, internalformat, width, height, depth, border, format, type, GLintptr offset);
  // void gl.texImage3D(target, level, internalformat, width, height, depth, border, format, type, HTMLCanvasElement source);
  // void gl.texImage3D(target, level, internalformat, width, height, depth, border, format, type, HTMLImageElement source);
  // void gl.texImage3D(target, level, internalformat, width, height, depth, border, format, type, HTMLVideoElement source);
  // void gl.texImage3D(target, level, internalformat, width, height, depth, border, format, type, ImageBitmap source);
  // void gl.texImage3D(target, level, internalformat, width, height, depth, border, format, type, ImageData source);
  // void gl.texImage3D(target, level, internalformat, width, height, depth, border, format, type, ArrayBufferView? srcData);
  // void gl.texImage3D(target, level, internalformat, width, height, depth, border, format, type, ArrayBufferView srcData, srcOffset);
  texImage3D(target, level, internalFormat, width, height, depth, border, format, type, pixels, srcOffset) {
    target |= 0;
    level |= 0;
    internalFormat |= 0;
    width |= 0;
    height |= 0;
    depth |= 0;
    border |= 0;
    format |= 0;
    type |= 0;
    srcOffset |= 0;

    if (typeof pixels !== 'object' && pixels !== undefined) {
      throw new TypeError('texImage3D(GLenum, GLint, GLenum, GLint, GLint, GLint, GLint, GLenum, GLenum, Uint8Array)');
    }

    if (!checkFormat(format) || !checkFormat(internalFormat)) {
      this.setError(gl.INVALID_ENUM);
      return;
    }

    if (type === gl.FLOAT && !this._extensions.oes_texture_float) {
      this.setError(gl.INVALID_ENUM);
      return;
    }

    const texture = this._getTexImage(target);
    if (!texture || format !== internalFormat) {
      this.setError(gl.INVALID_OPERATION);
      return;
    }

    const pixelSize = this._computePixelSize(type, format);
    if (pixelSize === 0) {
      return;
    }

    if (!this._checkDimensions(target, width, height, level)) {
      return;
    }

    const data = convertPixels(pixels);
    const rowStride = this._computeRowStride(width, pixelSize);
    const imageSize = rowStride * height;

    if (data && data.length < imageSize) {
      this.setError(gl.INVALID_OPERATION);
      return;
    }

    if (border !== 0 || (validCubeTarget(target) && width !== height)) {
      this.setError(gl.INVALID_VALUE);
      return;
    }
    // Need to check for out of memory error
    this._saveError();
    super.texImage3D(target, level, internalFormat, width, height, depth, border, format, type, data);
    const error = this.getError();
    this._restoreError(error);
    if (error !== gl.NO_ERROR) {
      return;
    }

    // Save width and height at level
    texture._levelWidth[level] = width;
    texture._levelHeight[level] = height;
    texture._format = format;
    texture._type = type;

    const activeFramebuffer = this._activeFramebuffer;
    if (activeFramebuffer) {
      let needsUpdate = false;
      const attachments = this._getAttachments();
      for (let i = 0; i < attachments.length; ++i) {
        if (activeFramebuffer._attachments[attachments[i]] === texture) {
          needsUpdate = true;
          break;
        }
      }
      if (needsUpdate) {
        this._updateFramebufferAttachments(this._activeFramebuffer);
      }
    }
  }

  createVertexArray() {
    const id = super.createVertexArray();
    if (id <= 0) return null;
    const webGLVertexArrayObject = new WebGLVertexArrayObject(id, this);
    return webGLVertexArrayObject;
  }

  bindVertexArray(object) {
    if (!checkObject(object)) {
      throw new TypeError('bindVertexArray(WebGLVertexArrayObject');
    }

    if (!object) {
      super.bindVertexArray(0);
    } else if (object._pendingDelete) {
      return;
    } else if (this._checkWrapper(object, WebGLVertexArrayObject)) {
      super.bindVertexArray(object._ | 0);
    } else {
      return;
    }

    const active = this._activeVertexArray;
    if (active !== object) {
      if (active) {
        active._refCount -= 1;
        active._checkDelete();
      }
      if (object) {
        object._refCount += 1;
      }
    }

    this._activeVertexArray = object;
  }

  deleteVertexArray(object) {
    if (!checkObject(object)) {
      throw new TypeError('deleteVertexArray(WebGLVertexArrayObject)');
    }

    if (!(object instanceof WebGLVertexArrayObject && this._checkOwns(object))) {
      this.setError(gl.INVALID_OPERATION);
      return;
    }
  }

  isVertexArray(object) {
    if (!this._isObject(object, 'isVertexArray', WebGLVertexArrayObject)) return false;

    return super.isVertexArray(object._ | 0);
  }

  texStorage2D(target, levels, internalformat, width, height) {
    target |= 0;
    levels |= 0;
    internalformat |= 0;
    width |= 0;
    height |= 0;

    if (target !== gl.TEXTURE_2D && target !== gl.TEXTURE_CUBE_MAP) {
      this.setError(gl.INVALID_ENUM);
      return;
    }

    super.texStorage2D(target, levels, internalformat, width, height);
  }

  renderbufferStorageMultisample(target, samples, internalFormat, width, height) {
    target |= 0;
    samples |= 0;
    internalFormat |= 0;
    width |= 0;
    height |= 0;

    if (target !== gl.RENDERBUFFER) {
      this.setError(gl.INVALID_ENUM);
      return;
    }

    const renderbuffer = this._activeRenderbuffer;
    if (!renderbuffer) {
      this.setError(gl.INVALID_OPERATION);
      return;
    }

    if (
      internalFormat !== gl.R8UI &&
      internalFormat !== gl.R8I &&
      internalFormat !== gl.R16UI &&
      internalFormat !== gl.R16I &&
      internalFormat !== gl.R32UI &&
      internalFormat !== gl.R32I &&
      internalFormat !== gl.RG8 &&
      internalFormat !== gl.RG8UI &&
      internalFormat !== gl.RG8I &&
      internalFormat !== gl.RG16UI &&
      internalFormat !== gl.RG16I &&
      internalFormat !== gl.RG32UI &&
      internalFormat !== gl.RG32I &&
      internalFormat !== gl.RGB8 &&
      internalFormat !== gl.RGBA8 &&
      internalFormat !== gl.SRGB8_ALPHA8 &&
      internalFormat !== gl.RGBA4 &&
      internalFormat !== gl.RGB565 &&
      internalFormat !== gl.RGB5_A1 &&
      internalFormat !== gl.RGB10_A2 &&
      internalFormat !== gl.RGBA8UI &&
      internalFormat !== gl.RGBA8I &&
      internalFormat !== gl.RGB10_A2UI &&
      internalFormat !== gl.RGBA16UI &&
      internalFormat !== gl.RGBA16I &&
      internalFormat !== gl.RGBA32I &&
      internalFormat !== gl.RGBA32UI &&
      internalFormat !== gl.DEPTH_COMPONENT16 &&
      internalFormat !== gl.DEPTH_COMPONENT24 &&
      internalFormat !== gl.DEPTH_COMPONENT32F &&
      internalFormat !== gl.DEPTH_STENCIL &&
      internalFormat !== gl.DEPTH24_STENCIL8 &&
      internalFormat !== gl.DEPTH32F_STENCIL8 &&
      internalFormat !== gl.STENCIL_INDEX8
    ) {
      this.setError(gl.INVALID_ENUM);
      return;
    }

    this._saveError();
    super.renderbufferStorageMultisample(target, samples, internalFormat, width, height);
    const error = this.getError();
    this._restoreError(error);
    if (error !== gl.NO_ERROR) {
      return;
    }

    renderbuffer._width = width;
    renderbuffer._height = height;
    renderbuffer._format = internalFormat;
    renderbuffer._sample = samples;

    const activeFramebuffer = this._activeFramebuffer;
    if (activeFramebuffer) {
      let needsUpdate = false;
      const attachments = this._getAttachments();
      for (let i = 0; i < attachments.length; ++i) {
        if (activeFramebuffer._attachments[attachments[i]] === renderbuffer) {
          needsUpdate = true;
          break;
        }
      }
      if (needsUpdate) {
        this._updateFramebufferAttachments(this._activeFramebuffer);
      }
    }
  }

  drawBuffers(buffers) {
    if (!Array.isArray(buffers)) {
      this.setError(gl.INVALID_VALUE);
      return;
    }

    if (!this._checkStencilState()) {
      return;
    }

    super.drawBuffers(buffers);
  }

  blitFramebuffer(srcX0, srcY0, srcX1, srcY1, dstX0, dstY0, dstX1, dstY1, mask, filter) {
    if (!this._checkStencilState()) {
      return;
    }
    super.blitFramebuffer(srcX0, srcY0, srcX1, srcY1, dstX0, dstY0, dstX1, dstY1, mask, filter);
  }
}

module.exports = { WebGL2RenderingContext };
