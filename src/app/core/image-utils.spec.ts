import { isAcceptableImageFile } from './image-utils';

function fakeFile(name: string, type: string): File {
  return new File(['x'], name, { type });
}

describe('isAcceptableImageFile', () => {
  it('acepta imágenes con MIME y extensión válidos', () => {
    expect(isAcceptableImageFile(fakeFile('obra.jpg', 'image/jpeg'))).toBeTrue();
    expect(isAcceptableImageFile(fakeFile('obra.png', 'image/png'))).toBeTrue();
    expect(isAcceptableImageFile(fakeFile('obra.webp', 'image/webp'))).toBeTrue();
  });

  it('rechaza archivos que no son imágenes (MIME no image/*)', () => {
    expect(isAcceptableImageFile(fakeFile('documento.pdf', 'application/pdf'))).toBeFalse();
    expect(isAcceptableImageFile(fakeFile('script.js', 'text/javascript'))).toBeFalse();
  });

  it('rechaza extensiones fuera de la lista aunque el MIME diga image/*', () => {
    expect(isAcceptableImageFile(fakeFile('virus.svg', 'image/svg+xml'))).toBeFalse();
    expect(isAcceptableImageFile(fakeFile('archivo.bmp', 'image/bmp'))).toBeFalse();
  });

  it('rechaza un archivo sin extensión', () => {
    expect(isAcceptableImageFile(fakeFile('imagen', 'image/png'))).toBeFalse();
  });
});
