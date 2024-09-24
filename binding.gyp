{
    "variables": {
        "platform": "<(OS)",
        "openssl_fips": "0",
    },
    "conditions": [
        ['platform == "mac"', {"variables": {"platform": "darwin"}}],
        ['platform == "win"', {"variables": {"platform": "win32"}}],
    ],
    "targets": [
        {
            "target_name": "webgl",
            "defines": ["VERSION=1.0.0"],
            "sources": [
                "src/native/bindings.cc",
                "src/native/webgl.cc",
                "src/native/procs.cc",
            ],
            "include_dirs": [
                "<!(node -e \"require('nan')\")",
                "<(module_root_dir)/deps/include",
                "angle/include",
            ],
            "library_dirs": ["<(module_root_dir)/deps/<(platform)"],
            "conditions": [
                [
                    'OS=="mac"',
                    {
                        "libraries": [
                            "-framework QuartzCore", 
                            "-framework Quartz", 
                            "-Wl,-rpath,@loader_path",   
                            "-Wl,-rpath,@loader_path/..",     
                            "-lEGL", 
                            "-lGLESv2"
                        ],
                        "xcode_settings": {
                            "GCC_ENABLE_CPP_RTTI": "YES",
                            "GCC_ENABLE_CPP_EXCEPTIONS": "YES",
                            "MACOSX_DEPLOYMENT_TARGET": "10.8",
                            "CLANG_CXX_LIBRARY": "libc++",
                            "CLANG_CXX_LANGUAGE_STANDARD": "c++17",
                            "GCC_VERSION": "com.apple.compilers.llvm.clang.1_0",
                        },
                        "copies" : [
                            {
                                "files":[
                                    "deps/darwin/libEGL.dylib",
                                    "deps/darwin/libGLESv2.dylib",
                                ],
                                "destination":"<(PRODUCT_DIR)"
                            }
                        ],
                        "postbuilds": [
                            {
                                "postbuild_name": 'Change libEGL load path',
                                "action": ['install_name_tool', '-change',  './libEGL.dylib', '@loader_path/libEGL.dylib', '<(PRODUCT_DIR)/webgl.node'],
                            },
                            {
                                "postbuild_name": 'Change libGLESv2 load path',
                                "action": ['install_name_tool', '-change',  './libGLESv2.dylib', '@loader_path/libGLESv2.dylib', '<(PRODUCT_DIR)/webgl.node'],
                            },
                        ],
                    },
                ],
                [
                    'OS=="linux"',
                    {
                        "libraries":["-L.","-lEGL", "-lGLESv2"],
                        "ldflags": ["-Wl,-rpath,'$$ORIGIN'"],
                        "copies" : [
                            {
                                "files":[
                                    "deps/linux/libEGL.so",
                                    "deps/linux/libGLESv2.so",
                                    "deps/linux/libdawn_native.so",
                                    "deps/linux/libdawn_platform.so",
                                    "deps/linux/libdawn_proc.so",
                                    # "deps/linux/libthird_party_abseil-cpp_absl.so",
                                    # "deps/linux/libc++.so",
                                    # "deps/linux/libchrome_zlib.so"
                                ],
                                "destination":"<(PRODUCT_DIR)"
                            }
                        ]
                    },
                ],
                [
                    'OS=="win"',
                    {
                        "library_dirs": [
                            "<(module_root_dir)/deps/windows/lib/<(target_arch)",
                        ],
                        "libraries": ["libEGL.dll.lib", "libGLESv2.dll.lib"],
                        "defines": ["WIN32_LEAN_AND_MEAN", "VC_EXTRALEAN"],
                        "configurations": {
                            "Release": {
                                "msvs_settings": {
                                    "VCCLCompilerTool": {
                                        "RuntimeLibrary": 0,  # static release
                                        "Optimization": 0,  # /Od, disabled
                                        "FavorSizeOrSpeed": 1,  # /Ot, favour speed over size
                                        "InlineFunctionExpansion": 2,  # /Ob2, inline anything eligible
                                        "WholeProgramOptimization": "false",  # No
                                        "OmitFramePointers": "true",
                                        "EnableFunctionLevelLinking": "true",
                                        "EnableIntrinsicFunctions": "true",
                                        "RuntimeTypeInfo": "false",
                                        "ExceptionHandling": "0",
                                        "AdditionalOptions": [
                                            "/MP",  # compile across multiple CPUs
                                        ],
                                    },
                                    "VCLinkerTool": {
                                        "LinkTimeCodeGeneration": 0,  # Link Time Code generation default
                                        "OptimizeReferences": 1,  # /OPT:NOREF
                                        "EnableCOMDATFolding": 1,  # /OPT:NOICF
                                        "LinkIncremental": 2,  # /INCREMENTAL
                                        "AdditionalOptions": [
                                            "/LTCG:OFF",
                                        ],
                                    },
                                },
                                "msvs_configuration_attributes": {
                                    "OutputDirectory": "$(SolutionDir)$(ConfigurationName)",
                                    "IntermediateDirectory": "$(OutDir)\\obj\\$(ProjectName)",
                                },
                            }
                        },
                        "copies": [
                            {
                                "destination": "$(SolutionDir)$(ConfigurationName)",
                                "files": [
                                    # "<(module_root_dir)/deps/windows/dll/<(target_arch)/libc++.dll",
                                    # "<(module_root_dir)/deps/windows/dll/<(target_arch)/third_party_abseil-cpp_absl.dll",
                                    # "<(module_root_dir)/deps/windows/dll/<(target_arch)/third_party_zlib.dll",
                                    "<(module_root_dir)/deps/windows/dll/<(target_arch)/dawn_native.dll",
                                    "<(module_root_dir)/deps/windows/dll/<(target_arch)/dawn_platform.dll",
                                    "<(module_root_dir)/deps/windows/dll/<(target_arch)/dawn_proc.dll",
                                    "<(module_root_dir)/deps/windows/dll/<(target_arch)/libEGL.dll",
                                    "<(module_root_dir)/deps/windows/dll/<(target_arch)/libGLESv2.dll",
                                    "<(module_root_dir)/deps/windows/dll/<(target_arch)/d3dcompiler_47.dll",
                                ],
                            }
                        ],
                    },
                ],
            ],
        }
    ],
}
