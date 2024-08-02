const { WebGLRenderingContext } = require('./webgl-rendering-context');
const { WebGLVertexArrayObject } = require('./webgl-vertex-array-object.js');
const { getOESTextureFloatLinear } = require('./extensions/oes-texture-float-linear');
const { getSTACKGLDestroyContext } = require('./extensions/stackgl-destroy-context');
const { getSTACKGLResizeDrawingBuffer } = require('./extensions/stackgl-resize-drawing-buffer');
const { getEXTTextureFilterAnisotropic } = require('./extensions/ext-texture-filter-anisotropic');
const { gl, NativeWebGLRenderingContext } = require('./native-gl');
const { checkObject, validCubeTarget } = require('./utils');
const { WebGL2DrawBuffers } = require('./webgl2-draw-buffers.js');
const { WebGLFramebuffer } = require('./webgl-framebuffer.js');
const { verifyFormat, convertPixels, pixelSize } = require('./utils2.js');

const availableExtensions = {
  oes_texture_float_linear: getOESTextureFloatLinear,
  stackgl_destroy_context: getSTACKGLDestroyContext,
  stackgl_resize_drawingbuffer: getSTACKGLResizeDrawingBuffer,
  ext_texture_filter_anisotropic: getEXTTextureFilterAnisotropic,
};

class WebGL2RenderingContext extends WebGLRenderingContext {
  constructor() {
    super();
    this.isWebGL2 = true;

    this._drawBuffers = new WebGL2DrawBuffers(this);
  }

  _wrapShader(type, source) {
    return source;
  }

  _getAttachments() {
    return this._drawBuffers._ALL_ATTACHMENTS;
  }

  _getColorAttachments() {
    return this._drawBuffers._ALL_COLOR_ATTACHMENTS;
  }

  _validFramebufferAttachment(attachment) {
    switch (attachment) {
      case gl.DEPTH_ATTACHMENT:
      case gl.STENCIL_ATTACHMENT:
      case gl.DEPTH_STENCIL_ATTACHMENT:
      case gl.COLOR_ATTACHMENT0:
        return true;
    }

    return attachment < gl.COLOR_ATTACHMENT0 + this._drawBuffers._maxDrawBuffers; // eslint-disable-line
  }

  _verifyRenderableInternalColorFormat(format) {
    return (
      format === gl.RGBA4 ||
      format === gl.RGB565 ||
      format === gl.RGB5_A1 ||
      format === gl.R8 ||
      format === gl.R8UI ||
      format === gl.R8I ||
      format === gl.R16UI ||
      format === gl.R16I ||
      format === gl.R32UI ||
      format === gl.R32I ||
      format === gl.RG8 ||
      format === gl.RG8UI ||
      format === gl.RG8I ||
      format === gl.RG16UI ||
      format === gl.RG16I ||
      format === gl.RG32UI ||
      format === gl.RG32I ||
      format === gl.RGB8 ||
      format === gl.RGBA8 ||
      format === gl.SRGB8_ALPHA8 ||
      format === gl.RGB10_A2 ||
      format === gl.RGBA8UI ||
      format === gl.RGBA8I ||
      format === gl.RGB10_A2UI ||
      format === gl.RGBA16UI ||
      format === gl.RGBA16I ||
      format === gl.RGBA32I ||
      format === gl.RGBA32UI
    );
  }

  _verifyRenderableInternalDepthStencilFormat(format) {
    return (
      format === gl.DEPTH_COMPONENT16 ||
      format === gl.DEPTH_COMPONENT24 ||
      format === gl.DEPTH_COMPONENT32F ||
      format === gl.DEPTH_STENCIL ||
      format === gl.DEPTH24_STENCIL8 ||
      format === gl.DEPTH32F_STENCIL8 ||
      format === gl.STENCIL_INDEX ||
      format === gl.STENCIL_INDEX8
    );
  }

  getExtension(name) {
    const str = name.toLowerCase();
    if (str in this._extensions) {
      return this._extensions[str];
    }
    const ext = availableExtensions[str] ? availableExtensions[str](this) : null;
    if (ext) {
      this._extensions[str] = ext;
    }
    return ext;
  }

  getSupportedExtensions() {
    const exts = ['STACKGL_resize_drawingbuffer', 'STACKGL_destroy_context'];

    const supportedExts = NativeWebGLRenderingContext.prototype.getSupportedExtensions.call(this);

    if (supportedExts.indexOf('GL_OES_texture_float_linear') >= 0) {
      exts.push('OES_texture_float_linear');
    }

    if (supportedExts.indexOf('EXT_texture_filter_anisotropic') >= 0) {
      exts.push('EXT_texture_filter_anisotropic');
    }

    return exts;
  }

  /**
   * webgl2
   */

  bindFramebuffer(target, framebuffer) {
    if (!checkObject(framebuffer)) {
      throw new TypeError('bindFramebuffer(GLenum, WebGLFramebuffer)');
    }
    if (target !== gl.FRAMEBUFFER && target !== gl.DRAW_FRAMEBUFFER && target !== gl.READ_FRAMEBUFFER) {
      this.setError(gl.INVALID_ENUM);
      return;
    }
    if (!framebuffer) {
      NativeWebGLRenderingContext.prototype.bindFramebuffer.call(this, target, this._drawingBuffer._framebuffer);
    } else if (framebuffer._pendingDelete) {
      return;
    } else if (this._checkWrapper(framebuffer, WebGLFramebuffer)) {
      NativeWebGLRenderingContext.prototype.bindFramebuffer.call(this, target, framebuffer._ | 0);
    } else {
      return;
    }
    const activeFramebuffer = this._activeFramebuffer;
    if (activeFramebuffer !== framebuffer) {
      if (activeFramebuffer) {
        activeFramebuffer._refCount -= 1;
        activeFramebuffer._checkDelete();
      }
      if (framebuffer) {
        framebuffer._refCount += 1;
      }
    }
    this._activeFramebuffer = framebuffer;
    if (framebuffer) {
      this._updateFramebufferAttachments(framebuffer);
    }
  }

  // WebGL1
  // texImage2D(target, level, internalformat, width, height, border, format, type, pixels)
  // texImage2D(target, level, internalformat, format, type, pixels)

  // WebGL2
  // texImage2D(target, level, internalformat, width, height, border, format, type, offset)
  // texImage2D(target, level, internalformat, width, height, border, format, type, source)
  // texImage2D(target, level, internalformat, width, height, border, format, type, srcData, srcOffset)

  texImage2D(target, level, internalFormat, width, height, border, format, type, pixels, offset) {
    if (arguments.length === 6) {
      pixels = border;
      type = height;
      format = width;

      pixels = extractImageData(pixels);

      if (pixels == null) {
        throw new TypeError(
          'texImage2D(GLenum, GLint, GLenum, GLint, GLenum, GLenum, ImageData | HTMLImageElement | HTMLCanvasElement | HTMLVideoElement)'
        );
      }

      width = pixels.width;
      height = pixels.height;
      pixels = pixels.data;
    }

    target |= 0;
    level |= 0;
    internalFormat |= 0;
    width |= 0;
    height |= 0;
    border |= 0;
    format |= 0;
    type |= 0;
    offset |= 0;

    if (typeof pixels !== 'object' && typeof pixels !== 'number' && pixels !== undefined) {
      throw new TypeError('texImage2D(GLenum, GLint, GLenum, GLint, GLint, GLint, GLenum, GLenum, Uint8Array)');
    }

    if (typeof pixels === 'number') {
      offset = pixels;
      pixels = undefined;
    }

    if (!verifyFormat(internalFormat, format, type)) {
      this.setError(gl.INVALID_ENUM);
      return;
    }

    const texture = this._getTexImage(target);
    if (!texture) {
      this.setError(gl.INVALID_OPERATION);
      return;
    }

    const ps = pixelSize(internalFormat, type);
    if (ps === 0) {
      return;
    }

    if (!this._checkDimensions(target, width, height, level)) {
      return;
    }

    const data = convertPixels(pixels);
    const rowStride = this._computeRowStride(width, ps);
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
    NativeWebGLRenderingContext.prototype.texImage2D.call(
      this,
      target,
      level,
      internalFormat,
      width,
      height,
      border,
      format,
      type,
      data
    );
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

    if (!verifyFormat(internalFormat, format, type)) {
      this.setError(gl.INVALID_ENUM);
      return;
    }

    const texture = this._getTexImage(target);
    if (!texture) {
      this.setError(gl.INVALID_OPERATION);
      return;
    }

    const ps = pixelSize(internalFormat, type);
    if (ps === 0) {
      return;
    }

    if (!this._checkDimensions(target, width, height, level)) {
      return;
    }

    const data = convertPixels(pixels);
    const rowStride = this._computeRowStride(width, ps);
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
    NativeWebGLRenderingContext.prototype.texImage3D.call(
      this,
      target,
      level,
      internalFormat,
      width,
      height,
      depth,
      border,
      format,
      type,
      data
    );
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
    const id = NativeWebGLRenderingContext.prototype.createVertexArray.call(this);
    if (id <= 0) return null;
    const webGLVertexArrayObject = new WebGLVertexArrayObject(id, this);
    return webGLVertexArrayObject;
  }

  bindVertexArray(object) {
    if (!checkObject(object)) {
      throw new TypeError('bindVertexArray(WebGLVertexArrayObject');
    }

    if (!object) {
      NativeWebGLRenderingContext.prototype.bindVertexArray.call(this, 0);
    } else if (object._pendingDelete) {
      return;
    } else if (this._checkWrapper(object, WebGLVertexArrayObject)) {
      NativeWebGLRenderingContext.prototype.bindVertexArray.call(this, object._ | 0);
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

    return NativeWebGLRenderingContext.prototype.isVertexArray.call(this, object._ | 0);
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

    NativeWebGLRenderingContext.prototype.texStorage2D.call(this, target, levels, internalformat, width, height);
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
    NativeWebGLRenderingContext.prototype.renderbufferStorageMultisample.call(
      this,
      target,
      samples,
      internalFormat,
      width,
      height
    );
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

    NativeWebGLRenderingContext.prototype.drawBuffers.call(this, buffers);
  }

  blitFramebuffer(srcX0, srcY0, srcX1, srcY1, dstX0, dstY0, dstX1, dstY1, mask, filter) {
    if (!this._checkStencilState()) {
      return;
    }
    NativeWebGLRenderingContext.prototype.blitFramebuffer.call(
      this,
      srcX0,
      srcY0,
      srcX1,
      srcY1,
      dstX0,
      dstY0,
      dstX1,
      dstY1,
      mask,
      filter
    );
  }
}

module.exports = { WebGL2RenderingContext };
