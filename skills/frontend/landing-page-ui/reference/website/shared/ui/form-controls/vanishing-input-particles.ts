/**
 * One particle of a vanishing input's text: its color, size and place.
 */
export interface VanishingInputParticle {
  color: string;
  radius: number;
  x: number;
  y: number;
}

/**
 * The particles of a vanishing input's drawn text: one per pixel with none of
 * its red, green and blue at zero, in that pixel's color.
 *
 * @param pixels - The canvas's RGBA pixels.
 * @param width - The canvas's width in pixels.
 * @param height - The canvas's height in pixels.
 * @returns The particles.
 */
export const createVanishingInputParticles = (
  pixels: Uint8ClampedArray,
  width: number,
  height: number
): VanishingInputParticle[] => {
  const particles: VanishingInputParticle[] = [];

  for (let y = 0; y < height; y += 1) {
    const rowOffset = 4 * y * width;

    for (let x = 0; x < width; x += 1) {
      const pixelOffset = rowOffset + 4 * x;
      const red = pixels[pixelOffset];
      const green = pixels[pixelOffset + 1];
      const blue = pixels[pixelOffset + 2];
      const alpha = pixels[pixelOffset + 3];

      if (red !== 0 && green !== 0 && blue !== 0) {
        particles.push({
          color: `rgba(${red}, ${green}, ${blue}, ${alpha})`,
          radius: 1,
          x,
          y,
        });
      }
    }
  }

  return particles;
};

/**
 * One frame of the vanish: particles past the sweep's threshold drift and
 * shrink at random, and the gone ones drop out.
 *
 * @param particles - The particles still showing.
 * @param threshold - The sweep's position; particles past it move.
 * @param random - The random source, Math.random by default.
 * @returns The particles for the next frame.
 */
export const advanceVanishingInputParticles = (
  particles: VanishingInputParticle[],
  threshold: number,
  random: () => number = Math.random
) => {
  const nextParticles: VanishingInputParticle[] = [];

  for (const particle of particles) {
    if (particle.x < threshold) {
      nextParticles.push(particle);
    } else if (particle.radius > 0) {
      nextParticles.push({
        ...particle,
        radius: particle.radius - 0.05 * random(),
        x: particle.x + (random() > 0.5 ? 1 : -1),
        y: particle.y + (random() > 0.5 ? 1 : -1),
      });
    }
  }

  return nextParticles;
};
