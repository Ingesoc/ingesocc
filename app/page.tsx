'use client'

import Image from 'next/image'
import { ArrowUpRight, ChevronDown, Menu } from 'lucide-react'
import { useState } from 'react'

const projects = [
  {
    name: 'Casa Ladera',
    location: 'Envigado · Antioquia',
    category: 'Residencial',
    year: '2024',
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1400&q=85',
    className: 'md:col-span-7 md:row-span-2',
  },
  {
    name: 'Distrito 48',
    location: 'Medellín · Antioquia',
    category: 'Comercial',
    year: '2023',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=85',
    className: 'md:col-span-5',
  },
  {
    name: 'Taller Norte',
    location: 'Bello · Antioquia',
    category: 'Industrial',
    year: '2022',
    image: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=85',
    className: 'md:col-span-5',
  },
]

const services = ['Construcción', 'Diseño y arquitectura', 'Gerencia de proyectos', 'Remodelación', 'Desarrollo inmobiliario']

export default function Page() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <header className="absolute inset-x-0 top-0 z-20 px-5 py-5 text-white md:px-10 md:py-7">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between">
          <a href="#inicio" aria-label="Ingesocc inicio" className="flex items-center gap-3">
            <Image src="/ingesocc-logo.jpg" alt="Ingesocc S.A.S." width={52} height={52} className="h-12 w-12 rounded-full object-cover" />
            <span className="hidden text-xs font-bold uppercase tracking-[0.24em] sm:block">Ingesocc S.A.S.</span>
          </a>
          <nav className="hidden items-center gap-8 text-[11px] font-semibold uppercase tracking-[0.18em] lg:flex" aria-label="Navegación principal">
            <a href="#proyectos" className="transition-colors hover:text-accent">Proyectos</a>
            <a href="#servicios" className="transition-colors hover:text-accent">Servicios</a>
            <a href="#nosotros" className="transition-colors hover:text-accent">Nosotros</a>
            <a href="#contacto" className="rounded-full border border-white/50 px-5 py-3 transition-colors hover:border-accent hover:bg-accent hover:text-primary-foreground">Solicitar cotización <ArrowUpRight className="ml-2 inline h-3 w-3" /></a>
          </nav>
          <button className="flex h-11 w-11 items-center justify-center rounded-full border border-white/50 lg:hidden" onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen} aria-label="Abrir menú">
            <Menu className="h-5 w-5" />
          </button>
        </div>
        {menuOpen && <nav className="mt-4 flex flex-col gap-4 rounded-2xl bg-primary p-5 text-sm uppercase tracking-widest lg:hidden" aria-label="Menú móvil"><a href="#proyectos">Proyectos</a><a href="#servicios">Servicios</a><a href="#nosotros">Nosotros</a><a href="#contacto" className="text-accent">Solicitar cotización</a></nav>}
      </header>

      <section id="inicio" className="relative flex min-h-[720px] items-end bg-primary px-5 pb-16 pt-32 text-white md:min-h-screen md:px-10 md:pb-20">
        <Image src="https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=2200&q=90" alt="Obra arquitectónica contemporánea en construcción" fill priority className="object-cover opacity-55" sizes="100vw" />
        <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/40 to-primary/10" />
        <div className="relative mx-auto grid w-full max-w-[1440px] gap-10 md:grid-cols-12 md:items-end">
          <div className="md:col-span-9">
            <p className="mb-6 text-xs font-semibold uppercase tracking-[0.28em] text-accent">Arquitectura · Ingeniería · Construcción</p>
            <h1 className="max-w-4xl text-balance font-sans text-5xl font-bold leading-[0.95] tracking-[-0.055em] md:text-8xl lg:text-[7.5rem]">Construimos espacios que trascienden.</h1>
          </div>
          <div className="md:col-span-3 md:pb-2">
            <p className="max-w-xs text-sm leading-6 text-white/75">Diseñamos y ejecutamos proyectos con precisión, propósito y una visión que permanece.</p>
            <a href="#contacto" className="mt-6 inline-flex items-center gap-2 border-b border-accent pb-2 text-xs font-bold uppercase tracking-[0.18em] text-accent">Hablemos <ArrowUpRight className="h-4 w-4" /></a>
          </div>
        </div>
        <a href="#manifiesto" className="absolute bottom-7 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-white/60"><span>Descubrir</span><ChevronDown className="h-4 w-4 animate-bounce" /></a>
      </section>

      <section id="manifiesto" className="px-5 py-24 md:px-10 md:py-40">
        <div className="mx-auto grid max-w-[1440px] gap-12 md:grid-cols-12">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-accent md:col-span-2">01 / Nuestra visión</p>
          <div className="md:col-span-9 md:col-start-4"><h2 className="text-balance text-4xl font-bold leading-[1.05] tracking-[-0.04em] md:text-7xl">Más que proyectos.<br /><span className="text-muted-foreground">Construimos futuro.</span></h2><p className="mt-10 max-w-xl text-base leading-7 text-muted-foreground">En Ingesocc convertimos ideas en espacios de valor. Unimos conocimiento técnico, sensibilidad arquitectónica y ejecución rigurosa para crear obras que mejoran la vida de quienes las habitan.</p></div>
        </div>
      </section>

      <section id="proyectos" className="bg-secondary px-5 py-24 md:px-10 md:py-32">
        <div className="mx-auto max-w-[1440px]"><div className="mb-14 flex items-end justify-between gap-6"><div><p className="mb-4 text-xs font-bold uppercase tracking-[0.25em] text-accent">02 / Obra seleccionada</p><h2 className="text-4xl font-bold tracking-[-0.04em] md:text-6xl">Proyectos que hablan.</h2></div><a href="#contacto" className="hidden items-center gap-2 text-xs font-bold uppercase tracking-widest md:flex">Ver todos <ArrowUpRight className="h-4 w-4 text-accent" /></a></div><div className="grid auto-rows-[250px] gap-4 md:auto-rows-[280px] md:grid-cols-12">{projects.map((project) => <article key={project.name} className={`group relative overflow-hidden bg-primary ${project.className}`}><Image src={project.image} alt={project.name} fill className="object-cover transition-transform duration-700 group-hover:scale-105" sizes="(max-width: 768px) 100vw, 60vw" /><div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/10 to-transparent" /><div className="absolute inset-x-5 bottom-5 text-white md:inset-x-7 md:bottom-7"><div className="flex items-end justify-between gap-4"><div><p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-accent">{project.category} · {project.year}</p><h3 className="text-2xl font-bold tracking-tight md:text-3xl">{project.name}</h3><p className="mt-1 text-sm text-white/70">{project.location}</p></div><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/50 transition-colors group-hover:border-accent group-hover:bg-accent group-hover:text-primary"><ArrowUpRight className="h-4 w-4" /></span></div></div></article>)}</div></div>
      </section>

      <section id="servicios" className="px-5 py-24 md:px-10 md:py-36"><div className="mx-auto max-w-[1440px]"><div className="grid gap-12 md:grid-cols-12"><div className="md:col-span-4"><p className="mb-4 text-xs font-bold uppercase tracking-[0.25em] text-accent">03 / Lo que hacemos</p><h2 className="text-4xl font-bold tracking-[-0.04em] md:text-6xl">Del concepto a la realidad.</h2></div><div className="md:col-span-7 md:col-start-6">{services.map((service, i) => <a href="#contacto" key={service} className="group flex items-center justify-between border-t border-border py-6 transition-colors hover:border-accent"><div className="flex items-center gap-6"><span className="font-mono text-xs text-muted-foreground">0{i + 1}</span><span className="text-2xl font-semibold tracking-tight md:text-4xl">{service}</span></div><ArrowUpRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-accent" /></a>)}</div></div></div></section>

      <section id="nosotros" className="bg-primary px-5 py-24 text-white md:px-10 md:py-32"><div className="mx-auto grid max-w-[1440px] gap-14 md:grid-cols-12 md:items-center"><div className="relative min-h-[460px] md:col-span-6"><Image src="https://images.unsplash.com/photo-1590579491624-f98f36d4c763?auto=format&fit=crop&w=1200&q=85" alt="Interior arquitectónico de líneas limpias" fill className="object-cover" sizes="50vw" /><div className="absolute -bottom-6 -right-3 w-36 bg-accent p-5 text-primary md:-right-8"><p className="text-5xl font-bold tracking-[-0.08em]">15</p><p className="mt-1 text-[10px] font-bold uppercase leading-4 tracking-widest">Años construyendo confianza</p></div></div><div className="md:col-span-5 md:col-start-8"><p className="mb-5 text-xs font-bold uppercase tracking-[0.25em] text-accent">04 / Ingesocc</p><h2 className="text-balance text-4xl font-bold leading-tight tracking-[-0.04em] md:text-6xl">El detalle hace la diferencia.</h2><p className="mt-8 text-base leading-7 text-white/65">Somos un equipo de arquitectos, ingenieros y constructores que cree en hacer las cosas bien: desde la primera línea hasta la última entrega.</p><div className="mt-12 grid grid-cols-2 gap-8 border-t border-white/20 pt-6"><div><p className="text-4xl font-bold">120<span className="text-accent">+</span></p><p className="mt-2 text-xs uppercase tracking-widest text-white/55">Proyectos ejecutados</p></div><div><p className="text-4xl font-bold">250K<span className="text-accent">+</span></p><p className="mt-2 text-xs uppercase tracking-widest text-white/55">m² construidos</p></div></div></div></div></section>

      <section id="contacto" className="px-5 py-24 md:px-10 md:py-36"><div className="mx-auto max-w-[1440px]"><div className="max-w-4xl"><p className="mb-5 text-xs font-bold uppercase tracking-[0.25em] text-accent">05 / Hablemos</p><h2 className="text-balance text-5xl font-bold leading-[0.98] tracking-[-0.055em] md:text-8xl">¿Tiene un proyecto en mente?</h2><a href="mailto:info@ingesocc.com" className="mt-10 inline-flex items-center gap-3 rounded-full bg-accent px-7 py-4 text-sm font-bold text-primary transition-transform hover:scale-105">Solicitar cotización <ArrowUpRight className="h-5 w-5" /></a></div><div className="mt-24 grid gap-8 border-t border-border pt-8 text-sm md:grid-cols-3"><div><p className="mb-3 text-xs uppercase tracking-widest text-muted-foreground">Escríbanos</p><a href="mailto:info@ingesocc.com" className="hover:text-accent">info@ingesocc.com</a></div><div><p className="mb-3 text-xs uppercase tracking-widest text-muted-foreground">Llámenos</p><a href="tel:+576044444444" className="hover:text-accent">+57 (604) 444 44 44</a></div><div><p className="mb-3 text-xs uppercase tracking-widest text-muted-foreground">Encuéntrenos</p><p>Medellín, Colombia</p></div></div></div></section>

      <footer className="bg-primary px-5 py-10 text-white md:px-10"><div className="mx-auto flex max-w-[1440px] flex-col justify-between gap-8 md:flex-row md:items-end"><div className="flex items-center gap-3"><Image src="/ingesocc-logo.jpg" alt="Ingesocc S.A.S." width={42} height={42} className="h-10 w-10 rounded-full object-cover" /><div><p className="text-sm font-bold uppercase tracking-[0.2em]">Ingesocc S.A.S.</p><p className="mt-1 text-xs text-white/50">Visionarios del diseño</p></div></div><div className="flex gap-6 text-xs uppercase tracking-widest text-white/60"><a href="#inicio" className="hover:text-accent">Instagram</a><a href="#inicio" className="hover:text-accent">LinkedIn</a><span>© 2026</span></div></div></footer>
    </main>
  )
}

