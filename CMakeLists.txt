cmake_minimum_required(VERSION 4.0)

find_package(cmake-fetch REQUIRED PATHS node_modules/cmake-fetch)

project(picolibc_sysroot C)

include(ExternalProject)

set(PICOLIBC_SYSROOT_VERSION "1.8.12" CACHE STRING "The picolibc release to build")

set(PICOLIBC_SYSROOT_TARGETS "riscv32-unknown-none-elf;thumbv8m.main-none-eabihf" CACHE STRING "The targets to build a sysroot for")

fetch_package(
  "github:picolibc/picolibc#${PICOLIBC_SYSROOT_VERSION}"
  SOURCE_DIR picolibc_source
  SOURCE_SUBDIR fetch-only
)

# picolibc only builds with Meson. The build that CMake supports is the one
# Zephyr embeds, which leaves out the startup code and semihosting.
find_program(meson NAMES meson REQUIRED)

set(stage "${CMAKE_CURRENT_BINARY_DIR}/stage")

# The host toolchain passes the resource directory and the directory of `lld` as
# compiler flags, which every sub-build needs as well. Meson asks the linker for
# its version even though nothing links.
separate_arguments(flags UNIX_COMMAND "${CMAKE_C_FLAGS}")

# The host's tools may not understand the targets, so use the ones that ship
# with the compiler.
cmake_path(GET CMAKE_C_COMPILER PARENT_PATH tools)

foreach(tool IN ITEMS ar nm strip)
  find_program(llvm_${tool} NAMES llvm-${tool} HINTS "${tools}" NO_DEFAULT_PATH REQUIRED)
endforeach()

# The flags must match those of the toolchains in `cmake-toolchains`, as they
# decide the ABI that every library in the sysroot is built for.
set(riscv32-unknown-none-elf_cpu_family riscv32)
set(riscv32-unknown-none-elf_cpu riscv32)
set(riscv32-unknown-none-elf_flags -march=rv32imac_zicsr_zifencei -mabi=ilp32)

set(thumbv8m.main-none-eabihf_cpu_family arm)
set(thumbv8m.main-none-eabihf_cpu armv8m)
set(thumbv8m.main-none-eabihf_flags -mfpu=fpv5-sp-d16)

foreach(target IN LISTS PICOLIBC_SYSROOT_TARGETS)
  if(NOT DEFINED ${target}_cpu_family)
    message(FATAL_ERROR "Unknown target '${target}'")
  endif()

  set(sysroot "${stage}/${target}")

  set(cpu_family ${${target}_cpu_family})
  set(cpu ${${target}_cpu})

  # Nothing can link before the libraries exist, and picolibc builds without
  # linking as long as the compiler leaves out the default libraries.
  set(c "${CMAKE_C_COMPILER}" ${flags} "--target=${target}" ${${target}_flags} -nostdlib)

  list(TRANSFORM c PREPEND "'")
  list(TRANSFORM c APPEND "'")
  list(JOIN c ", " c)

  set(cross_file "${CMAKE_CURRENT_BINARY_DIR}/${target}.txt")

  configure_file(cross-file.txt.in "${cross_file}" @ONLY)

  ExternalProject_Add(
    picolibc-${target}
    SOURCE_DIR "${picolibc_source}"
    BINARY_DIR "${CMAKE_CURRENT_BINARY_DIR}/picolibc-${target}"
    DOWNLOAD_COMMAND ""
    UPDATE_COMMAND ""
    CONFIGURE_COMMAND
      "${meson}" setup
        --cross-file "${cross_file}"
        "--prefix=${sysroot}"
        --libdir=lib
        --includedir=include
        -Ddebug=false
        -Dmultilib=false
        -Dspecsdir=none
        -Dtests=false
        # JavaScript engines print 64-bit integers.
        -Dio-long-long=true
        <BINARY_DIR> <SOURCE_DIR>
    BUILD_COMMAND "${meson}" compile -C <BINARY_DIR>
    INSTALL_COMMAND "${meson}" install -C <BINARY_DIR>
    USES_TERMINAL_CONFIGURE ON
    USES_TERMINAL_BUILD ON
    USES_TERMINAL_INSTALL ON
  )

  install(
    DIRECTORY "${sysroot}/"
    DESTINATION "${target}"
    USE_SOURCE_PERMISSIONS
  )

  install(
    FILES "${picolibc_source}/COPYING.picolibc"
    DESTINATION "${target}/share/doc/picolibc"
  )
endforeach()
