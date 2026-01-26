export const ITEMS = ['blusa', 'meias', 'calca', 'tenis'] as const;

export const COLORS = ['verde', 'azul', 'vermelho', 'amarelo'] as const;
export type ColorKey = typeof COLORS[number];

export const COLOR_HEX: Record<ColorKey, string> = {
    'verde': '#00ff00',
    'azul': '#0000ff',
    'vermelho': '#ff0000',
    'amarelo': '#ffff00'
};
