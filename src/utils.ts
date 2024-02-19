// Copyright (c) Tensorware.
// Distributed under the terms of the Modified BSD License.

import $ from 'jquery';

export function round_to(value: number, multiple: number): number {
    return multiple * Math.round(value / multiple);
}

export function clamp_value(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}

export function color_to_rgba(color: string): string {
    const ctx = window.document.createElement('canvas').getContext('2d');
    if (!ctx || !color) {
        return '';
    }
    ctx.fillStyle = color;
    const rgba = ctx.fillStyle || '';
    if (rgba.startsWith('#')) {
        const [r, g, b] = rgba.match(/\w\w/g)!.map((x) => parseInt(x, 16));
        return `rgba(${r}, ${g}, ${b}, 1.0)`;
    }
    return rgba;
}

export function rgba_to_rgb(rgba_fg: string, rgb_bg?: string): string {
    if (!rgba_fg || !rgba_fg.startsWith('rgba(') || !rgb_bg || !rgb_bg.startsWith('rgb(')) {
        return rgba_fg ? rgba_fg.substring(0, rgba_fg.lastIndexOf(',')).replace(/rgba/i, 'rgb') + ')' : rgba_fg;
    }
    const [r_fg, g_fg, b_fg, a_fg] = $.map(rgba_fg.substring(rgba_fg.indexOf('(') + 1, rgba_fg.lastIndexOf(')')).split(/,\s*/), Number);
    const [r_bg, g_bg, b_bg] = $.map(rgb_bg.substring(rgb_bg.indexOf('(') + 1, rgb_bg.lastIndexOf(')')).split(/,\s*/), Number);
    const rgb_fg = {
        r: Math.round((a_fg * (r_fg / 255) + (1 - a_fg) * (r_bg / 255)) * 255),
        g: Math.round((a_fg * (g_fg / 255) + (1 - a_fg) * (g_bg / 255)) * 255),
        b: Math.round((a_fg * (b_fg / 255) + (1 - a_fg) * (b_bg / 255)) * 255)
    };
    return `rgb(${rgb_fg.r}, ${rgb_fg.g}, ${rgb_fg.b})`;
}

export function rgba_background(target: JQuery<HTMLElement>): string {
    const elements = target.parents().addBack();
    const parents = elements.filter((i: number, p: HTMLElement) => {
        return !['', 'undefined', 'transparent', 'rgba(0, 0, 0, 0)'].includes($(p).css('background-color'));
    });
    const color = parents.last().css('background-color');
    if (!color) {
        return '';
    }
    return color_to_rgba(color);
}

export function class_suffix(target: JQuery<HTMLElement>, match: string): string {
    const classes = (target.attr('class') || '').split(/\s+/);
    const result = $.grep(classes, (x) => x.indexOf(match) === 0).join();
    return result.split('-').pop() || '';
}

export function class_rotate(target: JQuery<HTMLElement>, classes: string[]): string {
    for (let i = 0; i < classes.length; i++) {
        if (target.hasClass(classes[i])) {
            target.removeClass(classes[i]);
            i = i >= classes.length ? 0 : i + 1;
            if (classes[i]) {
                target.addClass(classes[i]);
            }
            return classes[i];
        }
    }
    target.addClass(classes[0]);
    return classes[0];
}
