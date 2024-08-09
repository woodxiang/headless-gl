const { WebGLRenderingContext } = require('./webgl-rendering-context');
const { WebGL2RenderingContext } = require('./webgl2-rendering-context');
const { bindPublics } = require('./utils');

function wrapContext(ctx, isWebGL2) {
  const wrapper = isWebGL2 ? new WebGL2RenderingContext() : new WebGLRenderingContext();

  const privateMethods = ['resize', 'destroy', 'constructor'];

  if (!isWebGL2) {
    bindPublics(Object.keys(ctx), wrapper, ctx, privateMethods);
    bindPublics(Object.keys(ctx.constructor.prototype), wrapper, ctx, privateMethods);
    bindPublics(Object.getOwnPropertyNames(ctx), wrapper, ctx, privateMethods);
    bindPublics(Object.getOwnPropertyNames(ctx.constructor.prototype), wrapper, ctx, privateMethods);
  } else {
    bindPublics(Object.keys(ctx), wrapper, ctx, privateMethods);
    bindPublics(Object.keys(ctx.constructor.prototype), wrapper, ctx, privateMethods);
    bindPublics(Object.getOwnPropertyNames(ctx), wrapper, ctx, privateMethods);
    bindPublics(Object.getOwnPropertyNames(WebGLRenderingContext.prototype), wrapper, ctx, privateMethods);
    bindPublics(Object.getOwnPropertyNames(ctx.constructor.prototype), wrapper, ctx, privateMethods);
  }

  Object.defineProperties(wrapper, {
    drawingBufferWidth: {
      get() {
        return ctx.drawingBufferWidth;
      },
      set(value) {
        ctx.drawingBufferWidth = value;
      },
    },
    drawingBufferHeight: {
      get() {
        return ctx.drawingBufferHeight;
      },
      set(value) {
        ctx.drawingBufferHeight = value;
      },
    },
  });

  return wrapper;
}

module.exports = { wrapContext };
