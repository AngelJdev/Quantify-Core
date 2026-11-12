"""Generar lecturas web desde Markdown canónico. Dependencia: Markdown==3.8.2.

No publica en la red: produce archivos estáticos para el sitio existente.
"""
from pathlib import Path
from html.parser import HTMLParser
from html import escape
from urllib.parse import urlsplit, unquote
import os
import markdown
from markdown.extensions.toc import slugify_unicode

ROOT = Path(__file__).resolve().parents[3]
PRACTICE = ROOT / 'docs/practica-07'
PAGES = {
    PRACTICE / 'README.md': PRACTICE / 'revision.html',
    PRACTICE / 'fichas.md': PRACTICE / 'fichas.html',
    PRACTICE / 'referencia-tecnica.md': PRACTICE / 'referencia.html',
    ROOT / 'docs/requerimientos/catalogo.md': PRACTICE / 'lecturas/requisitos.html',
    ROOT / 'docs/UHs/README.md': PRACTICE / 'lecturas/historias.html',
    ROOT / 'docs/requerimientos/reglas-negocio.md': PRACTICE / 'lecturas/reglas.html',
    ROOT / 'docs/requerimientos/aceptacion.md': PRACTICE / 'lecturas/aceptacion.html',
}


def relative(target, output):
    return os.path.relpath(target, output.parent).replace('\\', '/')


class Relocate(HTMLParser):
    """Ajustar enlaces respecto al archivo fuente y a su lectura web."""
    def __init__(self, source, output):
        super().__init__(convert_charrefs=False)
        self.source, self.output, self.parts = source, output, []

    def address(self, value):
        url = urlsplit(value)
        if url.netloc == 'angeljdev.github.io' and url.path.startswith('/Quantify-Core/'):
            return relative(ROOT / unquote(url.path.removeprefix('/Quantify-Core/')), self.output) + ('#' + url.fragment if url.fragment else '')
        if url.scheme or url.netloc or not url.path:
            return value
        target = (self.source.parent / unquote(url.path)).resolve()
        target = PAGES.get(target, target)
        # Las fichas y la guía se sirven como páginas del sitio.
        value = relative(target, self.output)
        if url.query:
            value += '?' + url.query
        if url.fragment:
            value += '#' + url.fragment
        return value

    def handle_starttag(self, tag, attrs):
        pairs = []
        for name, value in attrs:
            if value is not None and name in ('href', 'src'):
                value = self.address(value)
            pairs.append(name if value is None else f'{name}="{escape(value, quote=True)}"')
        self.parts.append('<' + tag + (' ' + ' '.join(pairs) if pairs else '') + '>')

    def handle_endtag(self, tag):
        self.parts.append(f'</{tag}>')

    def handle_data(self, data):
        self.parts.append(data)

    def handle_entityref(self, name):
        self.parts.append('&' + name + ';')

    def handle_charref(self, name):
        self.parts.append('&#' + name + ';')


for source, output in PAGES.items():
    text = source.read_text(encoding='utf-8')
    title = text.splitlines()[0].lstrip('# ')
    body = markdown.markdown(text.replace('<details>', '<details markdown="1">'), extensions=['tables', 'fenced_code', 'sane_lists', 'toc', 'md_in_html'], extension_configs={'toc': {'slugify': slugify_unicode}})
    parser = Relocate(source, output)
    parser.feed(body)
    body = ''.join(parser.parts)
    base = relative(PRACTICE, output) + '/'
    portal = relative(ROOT / 'index.html', output)
    output.parent.mkdir(exist_ok=True)
    output.write_text(f'''<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{escape(title)}</title><script src="{base}marca.js"></script><link rel="stylesheet" href="{base}entrega.css"><link rel="stylesheet" href="{base}lectura.css"><script src="{base}lectura.js" defer></script></head>
<body><header><p class="eyebrow">PRÁCTICA 07</p><nav aria-label="Sección Práctica 07"><a href="{portal}#practica-07">Volver al portal</a><a href="{base}revision.html">Los 15 puntos</a><a href="{base}navegacion.html">Diagrama conectado</a><a href="{relative(ROOT / 'docs/GUI/practica-07.html', output)}">Galería de sketches</a><a href="{base}index.html">Prototipo</a></nav></header>
<main class="reading">{body}</main><footer><a href="{base}revision.html">Práctica 07 · Guía completa</a><button id="back-top" type="button">Volver al inicio ↑</button></footer></body></html>
''', encoding='utf-8')
print(f'{len(PAGES)} lecturas web generadas desde sus fuentes Markdown.')
