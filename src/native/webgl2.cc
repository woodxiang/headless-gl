GL_METHOD(TexImage3D)
{
    GL_BOILERPLATE;

    GLenum target = Nan::To<int32_t>(info[0]).ToChecked();
    GLint level = Nan::To<int32_t>(info[1]).ToChecked();
    GLenum internalformat = Nan::To<int32_t>(info[2]).ToChecked();
    GLsizei width = Nan::To<int32_t>(info[3]).ToChecked();
    GLsizei height = Nan::To<int32_t>(info[4]).ToChecked();
    GLsizei depth = Nan::To<int32_t>(info[5]).ToChecked();
    GLint border = Nan::To<int32_t>(info[6]).ToChecked();
    GLenum format = Nan::To<int32_t>(info[7]).ToChecked();
    GLint type = Nan::To<int32_t>(info[8]).ToChecked();
    Nan::TypedArrayContents<unsigned char> pixels(info[9]);

    if (*pixels)
    {
        if (inst->unpack_flip_y || inst->unpack_premultiply_alpha)
        {
            unsigned char *unpacked = inst->unpackPixels(
                type, format, width, height, depth, *pixels);
            (inst->glTexImage3D)(
                target, level, internalformat, width, height, depth, border, format, type, unpacked);
            delete[] unpacked;
        }
        else
        {
            (inst->glTexImage3D)(
                target, level, internalformat, width, height, depth, border, format, type, *pixels);
        }
    }
    else
    {
        size_t length = width * height * depth * 4;
        if (type == GL_FLOAT)
        {
            length *= 4;
        }
        char *data = new char[length];
        memset(data, 0, length);
        (inst->glTexImage3D)(
            target, level, internalformat, width, height, depth, border, format, type, data);
        delete[] data;
    }
}

GL_METHOD(TexStorage2D)
{
    GL_BOILERPLATE;
    GLenum target = Nan::To<int32_t>(info[0]).ToChecked();
    GLint level = Nan::To<int32_t>(info[1]).ToChecked();
    GLenum internalformat = Nan::To<int32_t>(info[2]).ToChecked();
    GLsizei width = Nan::To<int32_t>(info[3]).ToChecked();
    GLsizei height = Nan::To<int32_t>(info[4]).ToChecked();
    (inst->glTexStorage2D)(target, level, internalformat, width, height);
}

GL_METHOD(RenderbufferStorageMultisample)
{
    GL_BOILERPLATE;

    GLenum target = Nan::To<int32_t>(info[0]).ToChecked();
    GLsizei samples = Nan::To<int32_t>(info[1]).ToChecked();
    GLenum internalformat = Nan::To<int32_t>(info[2]).ToChecked();
    GLsizei width = Nan::To<int32_t>(info[3]).ToChecked();
    GLsizei height = Nan::To<int32_t>(info[4]).ToChecked();

    // In WebGL, we map GL_DEPTH_STENCIL to GL_DEPTH24_STENCIL8
    if (internalformat == GL_DEPTH_STENCIL_OES)
    {
        internalformat = GL_DEPTH24_STENCIL8_OES;
    }
    else if (internalformat == GL_DEPTH_COMPONENT32_OES)
    {
        internalformat = inst->preferredDepth;
    }

    (inst->glRenderbufferStorageMultisample)(target, samples, internalformat, width, height);
}

GL_METHOD(DrawBuffers)
{
    GL_BOILERPLATE;

    v8::Local<v8::Array> buffersArray = v8::Local<v8::Array>::Cast(info[0]);
    GLuint numBuffers = buffersArray->Length();
    GLenum *buffers = new GLenum[numBuffers];

    for (GLuint i = 0; i < numBuffers; i++)
    {
        buffers[i] = Nan::Get(buffersArray, i).ToLocalChecked()->Uint32Value(Nan::GetCurrentContext()).ToChecked();
    }

    (inst->glDrawBuffers)(numBuffers, buffers);

    delete[] buffers;
}

GL_METHOD(CreateVertexArray)
{
    GL_BOILERPLATE;

    GLuint array;
    (inst->glGenVertexArrays)(1, &array);
    inst->registerGLObj(GLOBJECT_TYPE_VERTEX_ARRAY, array);

    info.GetReturnValue().Set(Nan::New<v8::Integer>(array));
}

GL_METHOD(DeleteVertexArray)
{
    GL_BOILERPLATE;

    GLuint array = Nan::To<uint32_t>(info[0]).ToChecked();
    inst->unregisterGLObj(GLOBJECT_TYPE_VERTEX_ARRAY, array);

    (inst->glDeleteVertexArrays)(1, &array);
}

GL_METHOD(IsVertexArray)
{
    GL_BOILERPLATE;

    info.GetReturnValue().Set(Nan::New<v8::Boolean>(
        (inst->glIsVertexArray)(Nan::To<uint32_t>(info[0]).ToChecked()) != 0));
}

GL_METHOD(BindVertexArray)
{
    GL_BOILERPLATE;

    GLuint array = Nan::To<uint32_t>(info[0]).ToChecked();

    (inst->glBindVertexArray)(array);
}

GL_METHOD(BlitFramebuffer)
{
    GL_BOILERPLATE;
    // srcX0, srcY0, srcX1, srcY1, dstX0, dstY0, dstX1, dstY1,
    GLint srcX0 = Nan::To<int32_t>(info[0]).ToChecked();
    GLint srcY0 = Nan::To<int32_t>(info[1]).ToChecked();
    GLint srcX1 = Nan::To<int32_t>(info[2]).ToChecked();
    GLint srcY1 = Nan::To<int32_t>(info[3]).ToChecked();
    GLint dstX0 = Nan::To<int32_t>(info[4]).ToChecked();
    GLint dstY0 = Nan::To<int32_t>(info[5]).ToChecked();
    GLint dstX1 = Nan::To<int32_t>(info[6]).ToChecked();
    GLint dstY1 = Nan::To<int32_t>(info[7]).ToChecked();
    GLuint mask = Nan::To<uint32_t>(info[8]).ToChecked();
    GLuint filter = Nan::To<uint32_t>(info[9]).ToChecked();

    (inst->glBlitFramebuffer)(srcX0, srcY0, srcX1, srcY1, dstX0, dstY0, dstX1, dstY1, mask, filter);
}