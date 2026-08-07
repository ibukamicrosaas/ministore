'use client'

import { useEffect } from 'react'

/* Moteur d'animations des écrans d'étapes — port direct du HTML mockup */
function playScreen(root: Element) {
  root.querySelectorAll<HTMLElement>('[data-appear]').forEach(el => {
    setTimeout(() => el.classList.add('in'), +(el.dataset.appear ?? 0))
  })

  root.querySelectorAll<HTMLElement>('[data-type]').forEach(el => {
    const full  = el.dataset.type ?? ''
    const delay = +(el.dataset.delay ?? 0)
    const fld   = el.closest<HTMLElement>('.fld')
    setTimeout(() => {
      if (fld) fld.classList.add('focus')
      else el.classList.add('typing')
      let i = 0
      const t = setInterval(() => {
        el.textContent = full.slice(0, ++i)
        if (i >= full.length) {
          clearInterval(t)
          setTimeout(() => {
            fld?.classList.remove('focus')
            el.classList.remove('typing')
          }, 300)
        }
      }, 32)
    }, delay)
  })

  root.querySelectorAll<HTMLElement>('[data-count]').forEach(el => {
    const target = +(el.dataset.count ?? 0)
    const delay  = +(el.dataset.delay ?? 0)
    const suf    = el.dataset.suffix ?? ''
    setTimeout(() => {
      const dur = 950, t0 = performance.now()
      const frame = (now: number) => {
        const k = Math.min(1, (now - t0) / dur)
        const v = Math.round(target * (1 - Math.pow(1 - k, 3)))
        el.textContent = v.toLocaleString('fr-FR').replace(/ | /g, ' ') + suf
        if (k < 1) requestAnimationFrame(frame)
      }
      requestAnimationFrame(frame)
    }, delay)
  })

  root.querySelectorAll<HTMLElement>('[data-swap]').forEach(el => {
    const txt   = el.dataset.swap ?? ''
    const delay = +(el.dataset.delay ?? 0)
    setTimeout(() => { el.innerHTML = txt; el.classList.add('copied') }, delay)
  })

  root.querySelectorAll<HTMLElement>('[data-swatch]').forEach(box => {
    const items = box.querySelectorAll<HTMLElement>('i')
    ;(box.dataset.swatch ?? '').split(',').forEach(pair => {
      const [idxStr, atStr] = pair.split(':')
      setTimeout(() => {
        items.forEach(i => i.classList.remove('on'))
        items[+idxStr]?.classList.add('on')
      }, +atStr || 0)
    })
  })

  root.querySelectorAll<HTMLElement>('[data-prog]').forEach(el => {
    ;(el.dataset.prog ?? '').split(',').forEach(pair => {
      const [pct, at] = pair.split(':')
      setTimeout(() => { el.style.width = pct + '%' }, +at || 0)
    })
  })

  root.querySelectorAll<HTMLElement>('[data-pin]').forEach(box => {
    const cells = box.querySelectorAll<HTMLElement>('i')
    const start = +(box.dataset.delay ?? 0)
    cells.forEach((cell, k) => {
      setTimeout(() => {
        cells.forEach(c => c.classList.remove('active'))
        cell.classList.add('filled')
        cells[k + 1]?.classList.add('active')
      }, start + k * 230)
    })
  })

  root.querySelectorAll<HTMLElement>('[data-ready]').forEach(el => {
    setTimeout(() => el.classList.add('ready'), +(el.dataset.ready ?? 0))
  })
}

function finalState(root: Element) {
  root.querySelectorAll<HTMLElement>('[data-appear]').forEach(el => el.classList.add('in'))
  root.querySelectorAll<HTMLElement>('[data-type]').forEach(el => { el.textContent = el.dataset.type ?? '' })
  root.querySelectorAll<HTMLElement>('[data-count]').forEach(el => {
    el.textContent = (+(el.dataset.count ?? 0)).toLocaleString('fr-FR').replace(/ | /g, ' ') + (el.dataset.suffix ?? '')
  })
  root.querySelectorAll<HTMLElement>('[data-swap]').forEach(el => { el.innerHTML = el.dataset.swap ?? ''; el.classList.add('copied') })
  root.querySelectorAll<HTMLElement>('[data-prog]').forEach(el => {
    const last = (el.dataset.prog ?? '').split(',').pop() ?? ''
    el.style.width = (last.split(':')[0] ?? '0') + '%'
  })
  root.querySelectorAll<HTMLElement>('[data-pin] i').forEach(c => c.classList.add('filled'))
  root.querySelectorAll<HTMLElement>('[data-swatch]').forEach(box => {
    const last  = (box.dataset.swatch ?? '').split(',').pop() ?? ''
    const items = box.querySelectorAll<HTMLElement>('i')
    items[+(last.split(':')[0] ?? '0')]?.classList.add('on')
  })
}

export function LandingV6Init() {
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // Reveal animations
    const reveals = document.querySelectorAll('.lv6 .reveal')
    if (reduce) {
      reveals.forEach(el => el.classList.add('visible'))
    } else {
      const io = new IntersectionObserver(entries => {
        entries.forEach(e => {
          if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target) }
        })
      }, { threshold: 0.1 })
      reveals.forEach(el => io.observe(el))
    }

    // Step screen animations
    const screens = document.querySelectorAll('.lv6 .step-media .app')
    if (reduce) {
      screens.forEach(finalState)
    } else {
      const so = new IntersectionObserver(entries => {
        entries.forEach(e => {
          if (e.isIntersecting) { playScreen(e.target); so.unobserve(e.target) }
        })
      }, { threshold: 0.35 })
      screens.forEach(el => so.observe(el))
    }
  }, [])

  return null
}
