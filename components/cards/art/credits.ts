/**
 * Where the cards' two pictures came from. Both are baked into silhouettes
 * by scripts/titles-silhouette.py; the credit is kept and shown on the last
 * card.
 */
export type Credit = { title: string; artist: string; year?: string; source: string; licence: string; kind: string };

/* The opening card. The Unsplash licence asks for nothing; the credit is courtesy. */
export const RIDER: Credit = {
  title: "A man riding a horse across a dirt field",
  artist: "Cemrecan Yurtman",
  source: "https://unsplash.com/photos/a-man-riding-a-horse-across-a-dirt-field-Vg4ePdejI8Y",
  licence: "Unsplash licence",
  kind: "a photograph",
};

/* The last card: the full-size scan of the painting, public domain. */
export const GATE: Credit = {
  title: "The Fall of the Cowboy",
  artist: "Frederic Remington",
  year: "1895",
  source: "https://commons.wikimedia.org/wiki/File:The_Fall_of_the_Cowboy,_1895,_by_Frederic_S._Remington.jpg",
  licence: "public domain",
  kind: "a painting",
};
