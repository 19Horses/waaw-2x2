// eslint-disable-next-line import/no-unresolved
import p5 from 'p5';
import type { CSSProperties } from 'react';
import { useEffect, useRef } from 'react';
import dollydotsFontUrl from '../fonts/dollydots.ttf';
import type { DJType } from '../queries/useGetDJs';
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
  const secondDJ = djs[1];
  const djNames = djs.map((dj) => dj.name).join('\n');

  if (isLoading) {
    return (
      <main className="home">
        <WaawMarquee djNames={djNames} />
        <p className="home__status">Loading DJs...</p>
      </main>
    );
  }

  if (isError) {
    return (
      <main className="home">
        <WaawMarquee djNames={djNames} />
        <p className="home__status">Could not load DJs.</p>
      </main>
    );
  }

  return (
    <main className="home">
      <WaawMarquee djNames={djNames} />

      <section className="home__content" aria-label="DJs">
        <div className="dj-matchup">
          {firstDJ ? <DJCard dj={firstDJ} /> : null}
          {firstDJ && secondDJ ? <span className="dj-matchup__x">X</span> : null}
          {secondDJ ? <DJCard dj={secondDJ} /> : null}
        </div>
      </section>
    </main>
  );
}

type DJCardProps = {
  dj: DJType;
};

const DJCard = ({ dj }: DJCardProps) => (
  <article className="dj-card">
    {dj.image ? (
      <div className="dj-card__mosaic" role="img" aria-label={`${dj.name} portrait`}>
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
                '--tile-row': tile.row,
              } as CSSProperties
            }
          >
            <img className="dj-card__tile-image" src={dj.image} alt="" />
          </span>
        ))}
      </div>
    ) : null}
    <h2 className="dj-card__name">{dj.name}</h2>
  </article>
);

type WaawMarqueeProps = {
  djNames: string;
};

const WaawMarquee = ({ djNames }: WaawMarqueeProps) => {
  const sketchRootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = sketchRootRef.current;
    const djNameList = djNames.split('\n').filter(Boolean);

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
        const presenterY = y + wordHeight + presenterGap;
        const twoByTwoY = presenterY + columnWidth * 0.32;
        const namesY = twoByTwoY + columnWidth * 0.72;
        const nameWidth = canvasWidth * 0.92;
        const nameFontSize = clamp(canvasWidth * 0.13, 20, 46);
        const nameLineHeight = nameFontSize * 1.12;

        p.fill(255);
        if (dollyFont) {
          p.textFont(dollyFont);
        }
        p.textAlign(p.CENTER, p.TOP);
        p.textSize(waawSize);

        ['W', 'A', 'A', 'W'].forEach((letter, index) => {
          p.text(letter, centerX, y + letterStep * index);
        });

        drawFittedText('PRESENTS', centerX, presenterY, columnWidth, columnWidth * 0.36);
        drawFittedText('2x2', centerX, twoByTwoY, columnWidth, columnWidth * 0.86);

        if (djNameList.length > 0) {
          p.push();
          if (dollyFont) {
            p.textFont(dollyFont);
          }
          p.fill(255);
          p.textAlign(p.CENTER, p.TOP);

          djNameList.forEach((name, index) => {
            drawFittedText(name.toUpperCase(), centerX, namesY + nameLineHeight * index, nameWidth, nameFontSize);
          });
          p.pop();
        }
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
        const wordHeight = waawSize * 0.95 + letterStep * 3;
        const presenterGap = clamp(canvasHeight * 0.02, 12, 24);
        const nameFontSize = clamp(canvasWidth * 0.13, 20, 46);
        const nameListHeight = djNameList.length > 0 ? nameFontSize * 1.12 * djNameList.length : 0;
        const presenterStartOffset = Math.max(wordHeight - canvasHeight * 0.2, 0);
        const itemHeight = wordHeight + presenterGap + columnWidth * 1.26 + nameListHeight;
        const gap = clamp(canvasHeight * 0.42, 256, 576);
        const cycleHeight = itemHeight + gap;
        const scrollSpeed = cycleHeight / 110;
        const offset = ((p.millis() / 1000) * scrollSpeed) % cycleHeight;
        const centerX = canvasWidth / 2;

        p.clear();

        for (let y = offset - presenterStartOffset - cycleHeight; y < canvasHeight + cycleHeight; y += cycleHeight) {
          drawWaawItem(centerX, y);
        }
      };

      p.windowResized = resizeCanvasToRoot;
    };

    const p5Instance = new p5(sketch, root);

    return () => {
      p5Instance.remove();
    };
  }, [djNames]);

  return (
    <aside className="waaw-marquee" aria-hidden="true">
      <div className="waaw-marquee__sketch" ref={sketchRootRef} />
    </aside>
  );
};

export default Home;
