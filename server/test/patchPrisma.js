/**
 * mock.method() tidak bisa dipakai pada delegate model Prisma: proxy-nya
 * mengembalikan descriptor { writable, enumerable, configurable } tanpa `value`,
 * sehingga node:test menyimpulkan method-nya undefined. Penulisan properti biasa
 * justru jalan, jadi patch manual dengan pemulihan eksplisit.
 */
export function createPatcher() {
  const patched = [];
  return {
    patch(obj, name, fn) {
      patched.push({ obj, name, original: obj[name] });
      obj[name] = fn;
    },
    restore() {
      while (patched.length) {
        const { obj, name, original } = patched.pop();
        obj[name] = original;
      }
    }
  };
}
