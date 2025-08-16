import * as z from 'zod';

export const BitmapChar = z
  .object({
    data: z.array(z.string()),
  })
  .refine(
    ({ data }) => {
      const width = data[0].length;
      return data.every((row) => row.length === width);
    },
    {
      message: 'Each row width must be the same.',
    },
  )
  .transform((data) => {
    return {
      width: data.data[0].length,
      height: data.data.length,
      data: data.data.map((row) => parseInt(row, 2)),
    };
  });

export type BitmapChar = z.infer<typeof BitmapChar>;

export type BitmapFont = {
  name: string;
  chars: Record<string, BitmapChar>;
};
