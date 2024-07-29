const { Linkable } = require("./linkable");
const { gl } = require("./native-gl");

class WebGLVertexArrayObject extends Linkable {
  constructor(_, ctx) {
    super(_);
    this._ctx = ctx;
  }

  _performDelete() {
    const ctx = this._ctx;
  }
}

module.exports = { WebGLVertexArrayObject };
