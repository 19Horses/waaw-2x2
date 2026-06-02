// eslint-disable-next-line import/no-unresolved
import p5 from 'p5';
import type { CSSProperties } from 'react';
import { useEffect, useRef } from 'react';
import dollydotsFontUrl from '../fonts/dollydots.ttf';
import { useGetDJs } from '../queries/useGetDJs';

const DJ_MOSAIC_SIZE = 7;
const DJ_MOSAIC_TILES = Array.from({ length: DJ_MOSAIC_SIZE * DJ_MOSAIC_SIZE }, (_, index) => ({
  index,
  row: Math.floor(index / DJ_MOSAIC_SIZE),
  column: index % DJ_MOSAIC_SIZE,
}));

const getTileDelay = (index: number) => {
  const staggerStep = (index * 17 + (index % DJ_MOSAIC_SIZE) * 23) % DJ_MOSAIC_TILES.length;

  return `${staggerStep * 28}ms`;
};

const getTileDuration = (index: number) => `${620 + ((index * 31) % 360)}ms`;

function Home() {
  const { data: djs = [], isLoading, isError } = useGetDJs();
  const firstDJ = djs[0];

  if (isLoading) {
    return (
      <main className="home">
        <WaawMarquee />
        <p className="home__status">Loading DJs...</p>
      </main>
    );
  }

  if (isError) {
    return (
      <main className="home">
        <WaawMarquee />
        <p className="home__status">Could not load DJs.</p>
      </main>
    );
  }

  return (
    <main className="home">
      <WaawMarquee />

      <section className="home__content" aria-label="DJs">
        <p className="home__eyebrow">WAAW DJs</p>
        {firstDJ ? (
          <article className="dj-card">
            {firstDJ.image ? (
              <div className="dj-card__mosaic" role="img" aria-label={`${firstDJ.name} portrait`}>
                {DJ_MOSAIC_TILES.map((tile) => (
                  <span
                    aria-hidden="true"
                    className="dj-card__tile"
                    key={tile.index}
                    style={
                      {
                        '--tile-column': tile.column,
                        '--tile-delay': getTileDelay(tile.index),
                        '--tile-duration': getTileDuration(tile.index),
                        '--tile-image': `url(${firstDJ.image})`,
                        '--tile-row': tile.row,
                      } as CSSProperties
                    }
                  />
                ))}
              </div>
            ) : null}
            <h2 className="dj-card__name">{firstDJ.name}</h2>
          </article>
        ) : null}
      </section>
    </main>
  );
}

const WaawMarquee = () => {
  const sketchRootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = sketchRootRef.current;

    if (!root) {
      return undefined;
    }

    const sketch = (p: p5) => {
      let dollyFont: Awaited<ReturnType<p5['loadFont']>> | undefined;
      let canvasWidth = 0;
      let canvasHeight = 0;

      const resizeCanvasToRoot = () => {
        const rect = root.getBoundingClientRect();
        canvasWidth = rect.width;
        canvasHeight = rect.height || window.innerHeight;
        p.resizeCanvas(canvasWidth, canvasHeight);
      };

      const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

      const drawFittedText = (text: string, centerX: number, y: number, width: number, fontSize: number) => {
        p.textSize(fontSize);
        const measuredWidth = p.textWidth(text);
        const xScale = measuredWidth > 0 ? width / measuredWidth : 1;

        p.push();
        p.translate(centerX, y);
        p.scale(xScale, 1);
        p.text(text, 0, 0);
        p.pop();
      };

      const drawWaawItem = (centerX: number, y: number) => {
        const waawSize = clamp(canvasWidth * 0.82, 112, 304);
        const columnWidth = waawSize * 0.58;
        const letterStep = waawSize * 0.8;
        const wordHeight = waawSize * 0.95 + letterStep * 3;
        const presenterGap = clamp(canvasHeight * 0.02, 12, 24);

        p.fill(255);
        if (dollyFont) {
          p.textFont(dollyFont);
        }
        p.textAlign(p.CENTER, p.TOP);
        p.textSize(waawSize);

        ['W', 'A', 'A', 'W'].forEach((letter, index) => {
          p.text(letter, centerX, y + letterStep * index);
        });

        const presenterY = y + wordHeight + presenterGap;
        drawFittedText('PRESENTS', centerX, presenterY, columnWidth, columnWidth * 0.36);
        drawFittedText('2x2', centerX, presenterY + columnWidth * 0.32, columnWidth, columnWidth * 0.86);
      };

      p.setup = () => {
        const rect = root.getBoundingClientRect();
        canvasWidth = rect.width;
        canvasHeight = rect.height || window.innerHeight;

        p.createCanvas(canvasWidth, canvasHeight).parent(root);
        p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));

        void p.loadFont(dollydotsFontUrl).then((font) => {
          dollyFont = font;
        });
      };

      p.draw = () => {
        const waawSize = clamp(canvasWidth * 0.82, 112, 304);
        const columnWidth = waawSize * 0.58;
        const letterStep = waawSize * 0.8;
        const wordHeight = waawSize * 0.86 + letterStep * 3;
        const itemHeight = wordHeight + columnWidth * 1.3;
        const gap = clamp(canvasHeight * 0.42, 256, 576);
        const cycleHeight = itemHeight + gap;
        const scrollSpeed = cycleHeight / 110;
        const offset = ((p.millis() / 1000) * scrollSpeed) % cycleHeight;
        const centerX = canvasWidth / 2;

        p.clear();

        for (let y = offset - cycleHeight; y < canvasHeight + cycleHeight; y += cycleHeight) {
          drawWaawItem(centerX, y);
        }
      };

      p.windowResized = resizeCanvasToRoot;
    };

    const p5Instance = new p5(sketch, root);

    return () => {
      p5Instance.remove();
    };
  }, []);

  return (
    <aside className="waaw-marquee" aria-hidden="true">
      <div className="waaw-marquee__sketch" ref={sketchRootRef} />
    </aside>
  );
};

export default Home;
