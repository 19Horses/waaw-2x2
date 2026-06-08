// eslint-disable-next-line import/no-unresolved
import p5 from 'p5';
import type { CSSProperties } from 'react';
import { useEffect, useRef, useState } from 'react';
import dollydotsFontUrl from '../fonts/dollydots.ttf';
import { useGetCurrentlyPlaying } from '../queries/useGetCurrentlyPlaying';
import type { SetDJType, SetType } from '../queries/useGetSets';
import { useGetSets } from '../queries/useGetSets';

const DJ_MOSAIC_SIZE = 7;
const DJ_MOSAIC_TILES = Array.from(
  { length: DJ_MOSAIC_SIZE * DJ_MOSAIC_SIZE },
  (_, index) => ({
    index,
    row: Math.floor(index / DJ_MOSAIC_SIZE),
    column: index % DJ_MOSAIC_SIZE,
  })
);

const getTileDelay = (index: number) => {
  const staggerStep =
    (index * 17 + (index % DJ_MOSAIC_SIZE) * 23) % DJ_MOSAIC_TILES.length;

  return `${staggerStep * 28}ms`;
};

const getTileDuration = (index: number) => `${1200 + ((index * 31) % 700)}ms`;

const getTileBreatheDelay = (index: number) =>
  `${((index * 41 + (index % DJ_MOSAIC_SIZE) * 71) % 49) * 180}ms`;

const getTileBreatheDuration = (index: number) =>
  `${22000 + ((index * 997) % 14000)}ms`;

const getTileDrift = (index: number, salt: number) =>
  `${(((index * salt + salt * 3) % 9) - 4) * 0.065}rem`;

const getTileWaveDelay = (row: number) => `${row * 130}ms`;

const getGridWaveDuration = (dj: SetDJType, gridIndex: number) => {
  const seed = `${dj._id}-${dj.name}-${gridIndex}`;
  const hash = Array.from(seed).reduce(
    (total, character) => total + character.charCodeAt(0),
    0
  );

  return `${20 + (hash % 21)}s`;
};

const formatMilitaryTime = (date: Date) =>
  date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

const splitIntoPairs = <T,>(items: T[]) =>
  items.reduce<T[][]>((pairs, item, index) => {
    if (index % 2 === 0) {
      pairs.push([item]);
    } else {
      pairs[pairs.length - 1].push(item);
    }

    return pairs;
  }, []);

const getUniqueDJs = (djs: SetDJType[]) =>
  Array.from(
    djs
      .reduce((uniqueDJs, dj) => {
        if (!uniqueDJs.has(dj._id)) {
          uniqueDJs.set(dj._id, dj);
        }

        return uniqueDJs;
      }, new Map<string, SetDJType>())
      .values()
  );

const LINEUP_CYCLE_MS = 1_800_000;
const LINEUP_VISIBLE_MS = 60_000;
const DJ_GRID_ENTER_MS = 3300;
const DJ_GRID_EXIT_MS = 3300;
const LINEUP_ENTER_SETUP_MS = DJ_GRID_EXIT_MS;
const PLAYED_DJ_IDS_STORAGE_KEY = 'waaw-played-dj-ids';

type LineupPhase = 'entering' | 'exiting' | 'hidden' | 'visible';
type DJGridPhase = 'entering' | 'exiting' | 'visible';

const getStoredPlayedDJIds = () => {
  try {
    const storedIds = window.sessionStorage.getItem(PLAYED_DJ_IDS_STORAGE_KEY);

    return storedIds ? (JSON.parse(storedIds) as string[]) : [];
  } catch {
    return [];
  }
};

function Home() {
  const { data: sets = [], isLoading, isError } = useGetSets();
  const { data: currentlyPlaying } = useGetCurrentlyPlaying();
  const [lineupPhase, setLineupPhase] = useState<LineupPhase>('hidden');
  const [displayedSet, setDisplayedSet] = useState<SetType | undefined>();
  const [djGridPhase, setDJGridPhase] = useState<DJGridPhase>('entering');
  const [playedDJIds, setPlayedDJIds] =
    useState<string[]>(getStoredPlayedDJIds);
  const pendingSetRef = useRef<SetType | undefined>();
  const orderedSets = sets;
  const featuredSet = currentlyPlaying?.set ?? orderedSets[0];
  const visibleSet = displayedSet ?? featuredSet;
  const otherSets = orderedSets.filter((set) => set._id !== visibleSet?._id);
  const nonPlayingDJs = getUniqueDJs(otherSets.flatMap((set) => set.djs));
  const firstDJ = visibleSet?.djs[0];
  const secondDJ = visibleSet?.djs[1];
  const nowPlayingDJs =
    visibleSet?.djs.map((dj) => dj.name).join(' X ') ?? 'TBA';
  const djNames = Array.from(
    new Set(orderedSets.flatMap((set) => set.djs.map((dj) => dj.name)))
  );

  useEffect(() => {
    const timeoutIds: Array<ReturnType<typeof setTimeout>> = [];

    const hideLineup = () => {
      const timeoutId = setTimeout(() => {
        setLineupPhase('exiting');

        const exitTimeoutId = setTimeout(() => {
          setLineupPhase('hidden');
          showLineup();
        }, DJ_GRID_ENTER_MS);

        timeoutIds.push(exitTimeoutId);
      }, LINEUP_VISIBLE_MS);

      timeoutIds.push(timeoutId);
    };

    const showLineup = () => {
      const timeoutId = setTimeout(() => {
        setLineupPhase('entering');

        const enterTimeoutId = setTimeout(() => {
          setLineupPhase('visible');
          hideLineup();
        }, LINEUP_ENTER_SETUP_MS);

        timeoutIds.push(enterTimeoutId);
      }, LINEUP_CYCLE_MS - LINEUP_VISIBLE_MS);

      timeoutIds.push(timeoutId);
    };

    showLineup();

    return () => {
      timeoutIds.forEach((timeoutId) => {
        clearTimeout(timeoutId);
      });
    };
  }, []);

  useEffect(() => {
    if (!featuredSet) {
      return;
    }

    setPlayedDJIds((currentIds) => {
      const nextIds = Array.from(
        new Set([...currentIds, ...featuredSet.djs.map((dj) => dj._id)])
      );

      window.sessionStorage.setItem(
        PLAYED_DJ_IDS_STORAGE_KEY,
        JSON.stringify(nextIds)
      );

      return nextIds;
    });

    setDisplayedSet((currentSet) => {
      if (!currentSet) {
        setDJGridPhase('entering');
        return featuredSet;
      }

      if (currentSet._id === featuredSet._id) {
        return featuredSet;
      }

      pendingSetRef.current = featuredSet;
      setDJGridPhase('exiting');
      return currentSet;
    });
  }, [featuredSet]);

  useEffect(() => {
    if (djGridPhase === 'entering') {
      const timeoutId = window.setTimeout(() => {
        setDJGridPhase('visible');
      }, DJ_GRID_ENTER_MS);

      return () => {
        window.clearTimeout(timeoutId);
      };
    }

    if (djGridPhase === 'exiting') {
      const timeoutId = window.setTimeout(() => {
        setDisplayedSet(pendingSetRef.current);
        pendingSetRef.current = undefined;
        setDJGridPhase('entering');
      }, DJ_GRID_EXIT_MS);

      return () => {
        window.clearTimeout(timeoutId);
      };
    }

    return undefined;
  }, [djGridPhase, displayedSet?._id]);

  if (isLoading) {
    return (
      <main className="home">
        <WaawMarquee djNames={djNames} />
        <NowPlaying djNames={nowPlayingDJs} />
        <p className="home__status">Loading sets...</p>
      </main>
    );
  }

  if (isError) {
    return (
      <main className="home">
        <WaawMarquee djNames={djNames} />
        <NowPlaying djNames={nowPlayingDJs} />
        <p className="home__status">Could not load sets.</p>
      </main>
    );
  }

  return (
    <main className="home">
      <WaawMarquee djNames={djNames} />
      <NowPlaying djNames={nowPlayingDJs} />

      <section
        className={`home__content home__content--lineup-${lineupPhase}`}
        aria-label="DJs"
      >
        <div
          className={`dj-matchup dj-matchup--${djGridPhase}`}
          key={visibleSet?._id ?? 'empty'}
        >
          {firstDJ ? <DJCard dj={firstDJ} gridIndex={0} /> : null}
          {firstDJ && secondDJ ? (
            <span className="dj-matchup__x">X</span>
          ) : null}
          {secondDJ ? <DJCard dj={secondDJ} gridIndex={1} /> : null}
        </div>

        {nonPlayingDJs.length > 0 ? (
          <DJInterlude djs={nonPlayingDJs} playedDJIds={playedDJIds} />
        ) : null}
      </section>
    </main>
  );
}

type NowPlayingProps = {
  djNames: string;
};

const NowPlaying = ({ djNames }: NowPlayingProps) => {
  const [currentTime, setCurrentTime] = useState(() => new Date());

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  return (
    <aside className="now-playing" aria-label="Now playing">
      <p className="now-playing__label">Now Playing:</p>
      <p className="now-playing__djs">{djNames}</p>
      <time
        className="now-playing__time"
        dateTime={formatMilitaryTime(currentTime)}
      >
        {formatMilitaryTime(currentTime)}
      </time>
    </aside>
  );
};

type DJCardProps = {
  dj: SetDJType;
  gridIndex: number;
};

const DJCard = ({ dj, gridIndex }: DJCardProps) => (
  <article
    className="dj-card"
    style={
      {
        '--dj-name-delay': gridIndex === 0 ? '700ms' : '1100ms',
        '--grid-wave-duration': getGridWaveDuration(dj, gridIndex),
      } as CSSProperties
    }
  >
    <div className="dj-card__layout">
      {dj.image ? (
        <div
          className="dj-card__mosaic"
          role="img"
          aria-label={`${dj.name} portrait`}
        >
          {DJ_MOSAIC_TILES.map((tile) => (
            <span
              aria-hidden="true"
              className="dj-card__tile"
              key={tile.index}
              style={
                {
                  '--tile-breathe-delay': getTileBreatheDelay(tile.index),
                  '--tile-breathe-duration': getTileBreatheDuration(tile.index),
                  '--tile-column': tile.column,
                  '--tile-delay': getTileDelay(tile.index),
                  '--tile-drift-x-1': getTileDrift(tile.index, 13),
                  '--tile-drift-x-2': getTileDrift(tile.index, 29),
                  '--tile-drift-y-1': getTileDrift(tile.index, 19),
                  '--tile-drift-y-2': getTileDrift(tile.index, 37),
                  '--tile-duration': getTileDuration(tile.index),
                  '--tile-row': tile.row,
                  '--tile-wave-delay': getTileWaveDelay(tile.row),
                } as CSSProperties
              }
            >
              <span className="dj-card__tile-motion">
                <span className="dj-card__tile-wave">
                  <img className="dj-card__tile-image" src={dj.image} alt="" />
                </span>
              </span>
            </span>
          ))}
        </div>
      ) : null}
      <h2 className="dj-card__name">{dj.name}</h2>
    </div>
  </article>
);

type DJInterludeProps = {
  djs: SetDJType[];
  playedDJIds: string[];
};

const DJInterlude = ({ djs, playedDJIds }: DJInterludeProps) => {
  const scrollingDJs = [...djs, ...djs];

  return (
    <section className="dj-interlude" aria-label="Upcoming DJs">
      <div className="dj-interlude__track">
        {scrollingDJs.map((dj, index) => (
          <article
            aria-hidden={index >= djs.length ? 'true' : undefined}
            className={
              playedDJIds.includes(dj._id)
                ? 'dj-interlude__card dj-interlude__card--played'
                : 'dj-interlude__card'
            }
            key={`${dj._id}-${index}`}
            style={
              {
                '--dj-interlude-delay': `${(index % djs.length) * 110}ms`,
              } as CSSProperties
            }
          >
            {dj.image ? (
              <img
                className="dj-interlude__image"
                src={dj.image}
                alt={index >= djs.length ? '' : dj.name}
              />
            ) : null}
            <h2 className="dj-interlude__name">{dj.name}</h2>
          </article>
        ))}
      </div>
    </section>
  );
};

type WaawMarqueeProps = {
  djNames: string[];
};

const WaawMarquee = ({ djNames }: WaawMarqueeProps) => {
  const sketchRootRef = useRef<HTMLDivElement>(null);
  const djNamesRef = useRef<string[]>(djNames);

  useEffect(() => {
    djNamesRef.current = djNames;
  }, [djNames]);

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

      const clamp = (value: number, min: number, max: number) =>
        Math.min(Math.max(value, min), max);

      const drawFittedText = (
        text: string,
        centerX: number,
        y: number,
        width: number,
        fontSize: number
      ) => {
        p.textSize(fontSize);
        const measuredWidth = p.textWidth(text);
        const xScale = measuredWidth > 0 ? width / measuredWidth : 1;

        p.push();
        p.translate(centerX, y);
        p.scale(xScale, 1);
        p.text(text, 0, 0);
        p.pop();
      };

      const getWaawLayout = () => {
        const waawSize = clamp(canvasWidth * 0.82, 108, 295);
        const letterStep = waawSize * 0.8;
        const wordHeight = waawSize * 0.95 + letterStep * 3;
        const columnWidth = waawSize * 0.58;
        return { waawSize, letterStep, wordHeight, columnWidth };
      };

      const drawWaawItem = (centerX: number, y: number) => {
        const { waawSize, letterStep, wordHeight, columnWidth } =
          getWaawLayout();
        const nameWidth = canvasWidth * 0.58;
        const presenterGap = clamp(canvasHeight * 0.02, 12, 24);
        const presenterY = y + wordHeight + presenterGap;
        const twoByTwoY = presenterY + columnWidth * 0.32;
        const namesY = twoByTwoY + columnWidth * 1.05;
        const nameFontSize = clamp(canvasWidth * 0.095, 15, 32);
        const nameLineHeight = nameFontSize * 1.18;

        p.fill(255);
        if (dollyFont) {
          p.textFont(dollyFont);
        }
        p.textAlign(p.CENTER, p.TOP);

        const waawX = centerX + nameWidth * 0.05;

        (['W', 'A', 'A', 'W'] as const).forEach((letter, index) => {
          p.textSize(waawSize);
          p.text(letter, waawX, y + letterStep * index);
        });

        p.textFont('Georgia');
        drawFittedText(
          'PRESENTS',
          centerX,
          presenterY,
          nameWidth,
          columnWidth * 0.36
        );

        if (dollyFont) {
          p.textFont(dollyFont);
        }
        drawFittedText(
          '2x2',
          centerX,
          twoByTwoY,
          nameWidth,
          columnWidth * 0.86
        );

        if (djNamesRef.current.length > 0) {
          p.push();
          p.textFont('Georgia');
          p.fill(255);
          p.textAlign(p.CENTER, p.TOP);

          djNamesRef.current.forEach((name, index) => {
            drawFittedText(
              name.toUpperCase(),
              centerX,
              namesY + nameLineHeight * index,
              nameWidth,
              nameFontSize
            );
          });
          p.pop();
        }
      };

      const drawMobileWaawItem = (x: number, topY: number) => {
        const titleSize = clamp(canvasHeight * 0.58, 50, 88);
        const nameSize = clamp(canvasHeight * 0.23, 20, 32);
        const gap = clamp(canvasWidth * 0.14, 64, 118);
        const rowGap = nameSize * 0.95;
        const namePairs = splitIntoPairs(djNamesRef.current);
        const centerY = topY + canvasHeight / 2;
        const title = 'WAAW PRESENTS 2x2';

        p.fill(255);
        if (dollyFont) {
          p.textFont(dollyFont);
        }
        p.textAlign(p.LEFT, p.CENTER);
        p.textSize(titleSize);
        p.text(title, x, centerY);

        let pairX = x + p.textWidth(title) + gap;

        if (namePairs.length > 0) {
          p.push();
          p.textFont('Georgia');
          p.fill(255);
          p.textAlign(p.LEFT, p.CENTER);
          p.textSize(nameSize);

          namePairs.forEach((pair) => {
            const firstName = pair[0]?.toUpperCase() ?? '';
            const secondName = pair[1]?.toUpperCase() ?? '';

            p.text(firstName, pairX, centerY - rowGap / 2);
            p.text(secondName, pairX, centerY + rowGap / 2);

            pairX +=
              Math.max(p.textWidth(firstName), p.textWidth(secondName)) +
              gap * 0.32;
          });
          p.pop();
        }
      };

      const getMobileWaawItemWidth = () => {
        const titleSize = clamp(canvasHeight * 0.58, 50, 88);
        const nameSize = clamp(canvasHeight * 0.23, 20, 32);
        const gap = clamp(canvasWidth * 0.14, 64, 118);
        const namePairs = splitIntoPairs(djNamesRef.current);
        const title = 'WAAW PRESENTS 2x2';
        let width = 0;

        p.push();
        if (dollyFont) {
          p.textFont(dollyFont);
        }
        p.textSize(titleSize);
        width = p.textWidth(title) + gap;

        p.textFont('Georgia');
        p.textSize(nameSize);
        namePairs.forEach((pair) => {
          const firstName = pair[0]?.toUpperCase() ?? '';
          const secondName = pair[1]?.toUpperCase() ?? '';

          width +=
            Math.max(p.textWidth(firstName), p.textWidth(secondName)) +
            gap * 0.32;
        });
        p.pop();

        return width;
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
        const isMobileStrip = canvasWidth > canvasHeight * 1.4;

        if (isMobileStrip) {
          const itemWidth = getMobileWaawItemWidth();
          const gap = clamp(canvasWidth * 0.2, 96, 180);
          const cycleWidth = itemWidth + gap;
          const scrollSpeed = cycleWidth / 95;
          const offset = ((p.millis() / 1000) * scrollSpeed) % cycleWidth;

          p.clear();

          for (
            let x = -offset - cycleWidth;
            x < canvasWidth + cycleWidth;
            x += cycleWidth
          ) {
            drawMobileWaawItem(x, 0);
          }

          return;
        }

        const { wordHeight, columnWidth } = getWaawLayout();
        const presenterGap = clamp(canvasHeight * 0.02, 12, 24);
        const nameFontSize = clamp(canvasWidth * 0.095, 15, 32);
        const nameListHeight =
          djNamesRef.current.length > 0
            ? nameFontSize * 1.18 * djNamesRef.current.length
            : 0;
        const presenterStartOffset = Math.max(
          wordHeight - canvasHeight * 0.2,
          0
        );
        const itemHeight =
          wordHeight + presenterGap + columnWidth * 1.26 + nameListHeight;
        const gap = clamp(canvasHeight * 0.08, 48, 120);
        const cycleHeight = itemHeight + gap;
        const scrollSpeed = cycleHeight / 110;
        const offset = ((p.millis() / 1000) * scrollSpeed) % cycleHeight;
        const centerX = canvasWidth / 2;

        p.clear();

        for (
          let y = offset - presenterStartOffset - cycleHeight;
          y < canvasHeight + cycleHeight;
          y += cycleHeight
        ) {
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
