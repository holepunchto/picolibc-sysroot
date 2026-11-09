# picolibc-sysroot

Prebuilt picolibc sysroots for the [`llvm-runtime`](https://github.com/holepunchto/llvm-runtime) compiler. [picolibc](https://github.com/picolibc/picolibc) is built from source for each supported bare metal target.

```
npm i picolibc-sysroot
```

Each sysroot is built for the same instruction set and ABI as the matching toolchain in [`cmake-toolchains`](https://github.com/holepunchto/cmake-toolchains):

| Target                      | Instruction set                     | ABI      |
| --------------------------- | ----------------------------------- | -------- |
| `riscv32-unknown-none-elf`  | `rv32imac_zicsr_zifencei`           | `ilp32`  |
| `thumbv8m.main-none-eabihf` | Armv8-M Mainline with `fpv5-sp-d16` | `eabihf` |

## Usage

```js
const sysroot = require('picolibc-sysroot')

sysroot('riscv32-unknown-none-elf')
// /path/to/node_modules/picolibc-sysroot-riscv32-unknown-none-elf
```

## License

Apache-2.0. picolibc itself is distributed under the licenses listed in `share/doc/picolibc/COPYING.picolibc` of each sysroot.
