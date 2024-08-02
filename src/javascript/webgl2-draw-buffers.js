const { gl } = require('./native-gl');

class WebGL2DrawBuffers {
  constructor(ctx) {
    this.ctx = ctx;
    this._buffersState = [gl.BACK];
    this._maxDrawBuffers = ctx._getParameterDirect(gl.MAX_DRAW_BUFFERS);
    this._ALL_ATTACHMENTS = [];
    this._ALL_COLOR_ATTACHMENTS = [];
    const allColorAttachments = [
      gl.COLOR_ATTACHMENT0,
      gl.COLOR_ATTACHMENT1,
      gl.COLOR_ATTACHMENT2,
      gl.COLOR_ATTACHMENT3,
      gl.COLOR_ATTACHMENT4,
      gl.COLOR_ATTACHMENT5,
      gl.COLOR_ATTACHMENT6,
      gl.COLOR_ATTACHMENT7,
      gl.COLOR_ATTACHMENT8,
      gl.COLOR_ATTACHMENT9,
      gl.COLOR_ATTACHMENT10,
      gl.COLOR_ATTACHMENT11,
      gl.COLOR_ATTACHMENT12,
      gl.COLOR_ATTACHMENT13,
      gl.COLOR_ATTACHMENT14,
      gl.COLOR_ATTACHMENT15,
    ];
    while (this._ALL_ATTACHMENTS.length < this._maxDrawBuffers) {
      const colorAttachment = allColorAttachments.shift();
      this._ALL_ATTACHMENTS.push(colorAttachment);
      this._ALL_COLOR_ATTACHMENTS.push(colorAttachment);
    }
    this._ALL_ATTACHMENTS.push(gl.DEPTH_ATTACHMENT, gl.STENCIL_ATTACHMENT, gl.DEPTH_STENCIL_ATTACHMENT);
  }

  drawBuffers(buffers) {
    const { ctx } = this;
    if (buffers.length < 1) {
      ctx.setError(gl.INVALID_OPERATION);
      return;
    }

    for (let i = 0; i < buffers.length; i++) {
      if (
        buffers[i] !== gl.NONE &&
        buffer[i] !== gl.BACK &&
        !(buffer[i] < gl.COLOR_ATTACHMENT0 || buffer[i] > gl.COLOR_ATTACHMENT15)
      ) {
        ctx.setError(gl.INVALID_ENUM);
        return;
      }
    }

    this._buffersState = buffers;
    ctx.drawBuffers(buffers);
  }
}

module.exports = {
  WebGL2DrawBuffers,
};
